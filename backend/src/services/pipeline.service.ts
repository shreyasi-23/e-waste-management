import { Injectable, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { GeminiService } from '@/config/gemini.config';
import { StubDetector, parseTextInventory, normalizeEWasteType } from '@/shared/utils';
import {
  MetalEstimateOutputSchema,
  PriceSnapshotSchema,
  ExtractionPlanSchema,
  InventoryItemSchema,
  InventoryType,
} from '@/shared/contracts';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private detector = new StubDetector();

  constructor(
    private batchService: BatchService,
    private geminiService: GeminiService
  ) {}

  async executeStep(
    runId: string,
    batchId: string,
    stepName: string,
    stepFn: () => Promise<any>
  ): Promise<any> {
    try {
      const startTime = Date.now();
      this.logger.log(`Starting step: ${stepName}`, { batchId, runId });

      await this.batchService.updatePipelineStep(
        runId,
        stepName,
        'in_progress'
      );

      const output = await stepFn();

      const duration = Date.now() - startTime;
      await this.batchService.updatePipelineStep(
        runId,
        stepName,
        'completed',
        output,
        undefined,
        duration
      );

      this.logger.log(`Completed step: ${stepName}`, {
        batchId,
        runId,
        duration,
      });

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed step: ${stepName}`, {
        batchId,
        runId,
        error: errorMessage,
      });

      await this.batchService.updatePipelineStep(
        runId,
        stepName,
        'failed',
        undefined,
        errorMessage
      );

      throw error;
    }
  }

  async detectImages(runId: string, batchId: string, force?: boolean) {
    return this.executeStep(runId, batchId, 'DETECTING', async () => {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) throw new Error(`Batch ${batchId} not found`);

      const imageAssets = batch.imageAssets || [];
      if (imageAssets.length === 0) {
        this.logger.log('No images to detect');
        return { imagesProcessed: 0, detections: [] };
      }

      const detections = [];
      for (const asset of imageAssets) {
        // Skip if already detected and not force
        if (asset.detectionResult && !force) {
          detections.push(asset.detectionResult);
          continue;
        }

        // In real scenario, download from S3 and run detector
        // For now, use stub detector with dummy buffer
        const dummyBuffer = Buffer.from('dummy-image');
        const detection = await this.detector.detect(dummyBuffer);

        await this.batchService.addDetectionResult(asset.id, detection);
        detections.push(detection);
      }

      return {
        imagesProcessed: imageAssets.length,
        detections,
      };
    });
  }

  async parseTextInventory(runId: string, batchId: string) {
    return this.executeStep(
      runId,
      batchId,
      'PARSING_TEXT_INVENTORY',
      async () => {
        const batch = await this.batchService.getBatch(batchId);
        if (!batch) throw new Error(`Batch ${batchId} not found`);

        const textEntries = batch.textInventoryEntries || [];
        const parsed: any[] = [];

        for (const entry of textEntries) {
          const items = parseTextInventory(entry.rawText);
          parsed.push(...items);
        }

        return { textInventoryItems: parsed, count: parsed.length };
      }
    );
  }

  async normalizeInventory(
    runId: string,
    batchId: string,
    detections?: any,
    textItems?: any
  ) {
    return this.executeStep(
      runId,
      batchId,
      'NORMALIZING_INVENTORY',
      async () => {
        const normalized: any[] = [];

        // From detections
        if (detections && detections.detections) {
          for (const detection of detections.detections) {
            for (const label of detection.summaryLabels || []) {
              normalized.push({
                rawLabel: label.label,
                normalizedType: normalizeEWasteType(label.label),
                quantity: label.count,
                unit: 'count',
                confidence: label.confidenceMean > 0.8 ? 'high' : 'medium',
              });
            }
          }
        }

        // From text items
        if (textItems && textItems.textInventoryItems) {
          for (const item of textItems.textInventoryItems) {
            normalized.push({
              rawLabel: item.rawLabel,
              normalizedType: normalizeEWasteType(item.rawLabel),
              quantity: item.quantity,
              unit: item.unit || 'count',
              confidence: item.confidence || 'high',
            });
          }
        }

        // Save to DB
        await this.batchService.addNormalizedInventoryItems(
          batchId,
          normalized
        );

        return { normalizedItems: normalized, count: normalized.length };
      }
    );
  }

  async estimateMetals(runId: string, batchId: string) {
    return this.executeStep(
      runId,
      batchId,
      'ESTIMATING_METALS',
      async () => {
        const batch = await this.batchService.getBatch(batchId);
        if (!batch) throw new Error(`Batch ${batchId} not found`);

        const inventory = batch.inventoryNormalized || [];
        if (inventory.length === 0) {
          throw new Error('No normalized inventory for metal estimation');
        }

        const inventoryText = inventory
          .map(
            (item: any) =>
              `${item.normalizedType} - Quantity: ${item.quantity} ${item.unit}`
          )
          .join('\n');

        const prompt = `Analyze the following e-waste inventory and provide detailed metal composition estimates:

${inventoryText}

For each item type, estimate:
1. Precious metals (gold, silver, palladium, etc.)
2. Base metals (copper, aluminum, etc.)
3. Confidence levels

Provide aggregate totals in kilograms.`;

        const { data, meta } = await this.geminiService.generateJson(
          prompt,
          MetalEstimateOutputSchema
        );

        // Save to DB
        await this.batchService.createOrUpdateMetalEstimate(
          batchId,
          data,
          meta.promptHash,
          meta.modelName
        );

        return { metalEstimate: data, meta };
      }
    );
  }

  async pricingMetals(runId: string, batchId: string) {
    return this.executeStep(runId, batchId, 'PRICING_METALS', async () => {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) throw new Error(`Batch ${batchId} not found`);

      if (!batch.metalEstimate) {
        throw new Error('Metal estimate required for pricing');
      }

      const aggregates = batch.metalEstimate.aggregateTotalsKg as any;
      const metalsText = Object.entries(aggregates)
        .map(([metal, kg]) => `${metal}: ${kg} kg`)
        .join('\n');

      const prompt = `Provide current market prices (USD) for these precious and base metals:

${metalsText}

Include:
1. Current market price per kg
2. Source of pricing data
3. Timestamp
4. Market citations

Calculate gross value for the inventory.`;

      const { data, meta } = await this.geminiService.generateJson(
        prompt,
        PriceSnapshotSchema,
        { grounded: true }
      );

      await this.batchService.createOrUpdatePriceSnapshot(
        batchId,
        data,
        meta.promptHash,
        meta.modelName
      );

      return { priceSnapshot: data, meta };
    });
  }

  async planExtraction(runId: string, batchId: string) {
    return this.executeStep(
      runId,
      batchId,
      'PLANNING_EXTRACTION',
      async () => {
        const batch = await this.batchService.getBatch(batchId);
        if (!batch) throw new Error(`Batch ${batchId} not found`);

        if (!batch.metalEstimate || !batch.priceSnapshot) {
          throw new Error('Metal estimate and pricing required for extraction');
        }

        const metals = batch.metalEstimate.aggregateTotalsKg as any;
        const prices = batch.priceSnapshot.pricesPerKg as any;
        const grossValue = batch.priceSnapshot.totalGrossValueUsd;

        const prompt = `Create an extraction and recycling plan for this e-waste batch:

Metals (kg): ${JSON.stringify(metals, null, 2)}
Market Prices (USD/kg): ${JSON.stringify(prices, null, 2)}
Gross Value: $${grossValue}
Location: ${batch.location}

Provide:
1. Recommended processes per metal type
2. CAPEX estimate
3. OPEX estimate
4. Logistics costs
5. Timeline
6. Risks and mitigation
7. Sensitivity analysis (best/base/worst case)
8. Net profit calculation`;

        const { data, meta } = await this.geminiService.generateJson(
          prompt,
          ExtractionPlanSchema,
          { grounded: true }
        );

        await this.batchService.createOrUpdateExtractionPlan(
          batchId,
          data,
          meta.promptHash,
          meta.modelName
        );

        return { extractionPlan: data, meta };
      }
    );
  }

  async generateReport(runId: string, batchId: string) {
    return this.executeStep(runId, batchId, 'GENERATING_REPORT', async () => {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) throw new Error(`Batch ${batchId} not found`);

      const inventory = batch.inventoryNormalized || [];
      const detections = batch.imageAssets || [];
      const metals = batch.metalEstimate;
      const pricing = batch.priceSnapshot;
      const extraction = batch.extractionPlan;

      if (!metals || !pricing || !extraction) {
        throw new Error('Missing required pipeline outputs for report generation');
      }

      // Build detections summary
      const detectionSummary = {
        imagesProcessed: detections.length,
        labels: [] as any[],
      };

      const labelMap = new Map<string, { count: number; confidences: number[] }>();
      for (const asset of detections) {
        if (asset.detectionResult) {
          const labels = asset.detectionResult.summaryLabels as any;
          for (const label of labels) {
            const existing = labelMap.get(label.label) || {
              count: 0,
              confidences: [],
            };
            existing.count += label.count;
            existing.confidences.push(label.confidenceMean);
            labelMap.set(label.label, existing);
          }
        }
      }

      for (const [label, data] of labelMap) {
        detectionSummary.labels.push({
          label,
          count: data.count,
          confidenceMean:
            data.confidences.reduce((a: number, b: number) => a + b, 0) /
            data.confidences.length,
        });
      }

      // Calculate verdict
      const grossValue = pricing.totalGrossValueUsd;
      const totalCost = extraction.totalCostUsd;
      const netProfit = grossValue - totalCost;
      const viability = netProfit > 0;

      const verdict = viability
        ? 'Viable'
        : netProfit > -1000
          ? 'Uncertain'
          : 'NotViable';

      const reportJson = {
        executiveSummary: {
          grossValueUsd: grossValue,
          totalCostUsd: totalCost,
          netProfitUsd: netProfit,
          verdict,
          confidence: (metals.uncertainty && typeof metals.uncertainty === 'object' && 'aggregate' in metals.uncertainty ? (metals.uncertainty as any).aggregate : 'medium') ?? 'medium',
        },
        inventory,
        detections:
          detectionSummary.labels.length > 0 ? detectionSummary : undefined,
        metals: {
          aggregateTotalsKg: metals.aggregateTotalsKg,
          uncertainty: metals.uncertainty,
          citations: metals.citations,
        },
        pricing: {
          timestampUtc: pricing.timestampUtc.toISOString?.() || new Date().toISOString(),
          currency: pricing.currency,
          pricesPerKg: pricing.pricesPerKg,
          totalGrossValueUsd: pricing.totalGrossValueUsd,
          sources: pricing.sources,
        },
        extraction: {
          totalCostUsd: extraction.totalCostUsd,
          netProfitUsd: extraction.netProfitUsd,
          plan: extraction,
          risks: extraction.risks,
          sensitivity: extraction.sensitivity,
          citations: extraction.citations,
        },
        auditTrail: {
          detectorVersion: 'stub-v1',
          llmModels: {
            metals: 'gemini-2.0-flash',
            pricing: 'gemini-2.0-flash',
            extraction: 'gemini-2.0-flash',
          },
          promptHashes: {},
          createdAtUtc: new Date().toISOString(),
        },
      };

      await this.batchService.createOrUpdateInvestorReport(batchId, reportJson);

      return { report: reportJson };
    });
  }

  async runFullPipeline(batchId: string, force?: boolean) {
    const run = await this.batchService.createPipelineRun(batchId, {
      detector: 'stub-v1',
    });

    try {
      // Step 1: Detection
      const detections = await this.detectImages(run.id, batchId, force);

      // Step 2: Parse text inventory
      const textItems = await this.parseTextInventory(run.id, batchId);

      // Step 3: Normalize inventory
      const normalized = await this.normalizeInventory(
        run.id,
        batchId,
        detections,
        textItems
      );

      // Step 4: Estimate metals
      const metals = await this.estimateMetals(run.id, batchId);

      // Step 5: Price metals
      const pricing = await this.pricingMetals(run.id, batchId);

      // Step 6: Plan extraction
      const extraction = await this.planExtraction(run.id, batchId);

      // Step 7: Generate report
      const report = await this.generateReport(run.id, batchId);

      // Mark as done
      await this.batchService.updatePipelineStep(
        run.id,
        'DONE',
        'completed',
        { status: 'success' }
      );

      return {
        batchId,
        runId: run.id,
        status: 'completed',
        report: report.report,
      };
    } catch (error) {
      this.logger.error('Pipeline failed', { batchId, error });
      throw error;
    }
  }
}
