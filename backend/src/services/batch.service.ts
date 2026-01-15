import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createBatch(location?: string, metadata?: Record<string, any>) {
    const batch = await this.prisma.batch.create({
      data: {
        location: location || 'USA',
        metadata: metadata || {},
      },
    });

    return batch;
  }

  async getBatch(batchId: string) {
    return this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        imageAssets: {
          include: { detectionResult: true },
        },
        textInventoryEntries: true,
        inventoryNormalized: true,
        pipelineRuns: true,
        metalEstimate: true,
        priceSnapshot: true,
        extractionPlan: true,
        investorReport: true,
      },
    });
  }

  async addImageAsset(
    batchId: string,
    filename: string,
    s3Key: string,
    mimeType: string,
    size: number
  ) {
    return this.prisma.imageAsset.create({
      data: {
        batchId,
        filename,
        s3Key,
        mimeType,
        size,
      },
    });
  }

  async addTextInventoryEntry(batchId: string, rawText: string) {
    return this.prisma.textInventoryEntry.create({
      data: {
        batchId,
        rawText,
      },
    });
  }

  async getNormalizedInventory(batchId: string) {
    return this.prisma.inventoryNormalized.findMany({
      where: { batchId },
    });
  }

  async createPipelineRun(batchId: string, modelVersions?: Record<string, string>) {
    const runId = nanoid();
    return this.prisma.pipelineRun.create({
      data: {
        id: runId,
        batchId,
        currentStep: 'DETECTING',
        status: 'pending',
        modelVersions: modelVersions || {},
      },
    });
  }

  async updatePipelineStep(
    runId: string,
    step: string,
    status: string,
    output?: any,
    error?: string,
    duration?: number
  ) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
    });

    if (!run) {
      throw new Error(`PipelineRun ${runId} not found`);
    }

    const stepResults = (run.stepResults as any) || {};
    stepResults[step] = {
      status,
      output,
      error,
      duration,
      timestamp: new Date().toISOString(),
    };

    return this.prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        currentStep: step,
        status,
        stepResults,
      },
    });
  }

  async getPipelineRun(runId: string) {
    return this.prisma.pipelineRun.findUnique({
      where: { id: runId },
    });
  }

  async createOrUpdateMetalEstimate(
    batchId: string,
    data: any,
    promptHash?: string,
    modelUsed?: string
  ) {
    return this.prisma.metalEstimate.upsert({
      where: { batchId },
      create: {
        batchId,
        composition: data.composition,
        aggregateTotalsKg: data.aggregateTotalsKg,
        uncertainty: data.uncertainty,
        citations: data.citations || [],
        promptHash,
        modelUsed,
      },
      update: {
        composition: data.composition,
        aggregateTotalsKg: data.aggregateTotalsKg,
        uncertainty: data.uncertainty,
        citations: data.citations || [],
        promptHash,
        modelUsed,
      },
    });
  }

  async createOrUpdatePriceSnapshot(
    batchId: string,
    data: any,
    promptHash?: string,
    modelUsed?: string
  ) {
    return this.prisma.priceSnapshot.upsert({
      where: { batchId },
      create: {
        batchId,
        timestampUtc: new Date(data.timestampUtc),
        currency: data.currency || 'USD',
        pricesPerKg: data.pricesPerKg,
        totalGrossValueUsd: data.totalGrossValueUsd,
        sources: data.sources || [],
        promptHash,
        modelUsed,
      },
      update: {
        timestampUtc: new Date(data.timestampUtc),
        currency: data.currency || 'USD',
        pricesPerKg: data.pricesPerKg,
        totalGrossValueUsd: data.totalGrossValueUsd,
        sources: data.sources || [],
        promptHash,
        modelUsed,
      },
    });
  }

  async createOrUpdateExtractionPlan(
    batchId: string,
    data: any,
    promptHash?: string,
    modelUsed?: string
  ) {
    return this.prisma.extractionPlan.upsert({
      where: { batchId },
      create: {
        batchId,
        recommendedProcesses: data.recommendedProcesses,
        totalCostUsd: data.totalCostUsd,
        capexUsd: data.capexUsd,
        opexUsd: data.opexUsd,
        logisticsCostUsd: data.logisticsCostUsd,
        timeline: data.timeline,
        risks: data.risks || [],
        sensitivity: data.sensitivity,
        netProfitUsd: data.netProfitUsd,
        citations: data.citations || [],
        promptHash,
        modelUsed,
      },
      update: {
        recommendedProcesses: data.recommendedProcesses,
        totalCostUsd: data.totalCostUsd,
        capexUsd: data.capexUsd,
        opexUsd: data.opexUsd,
        logisticsCostUsd: data.logisticsCostUsd,
        timeline: data.timeline,
        risks: data.risks || [],
        sensitivity: data.sensitivity,
        netProfitUsd: data.netProfitUsd,
        citations: data.citations || [],
        promptHash,
        modelUsed,
      },
    });
  }

  async createOrUpdateInvestorReport(batchId: string, reportJson: any) {
    return this.prisma.investorReport.upsert({
      where: { batchId },
      create: {
        batchId,
        reportJson,
      },
      update: {
        reportJson,
      },
    });
  }

  async addDetectionResult(imageAssetId: string, data: any) {
    return this.prisma.detectionResult.upsert({
      where: { imageAssetId },
      create: {
        imageAssetId,
        rawBoxes: data.rawBoxes,
        summaryLabels: data.summaryLabels,
        modelVersion: data.modelVersion,
      },
      update: {
        rawBoxes: data.rawBoxes,
        summaryLabels: data.summaryLabels,
        modelVersion: data.modelVersion,
      },
    });
  }

  async addNormalizedInventoryItems(batchId: string, items: any[]) {
    // Clear existing for this batch
    await this.prisma.inventoryNormalized.deleteMany({
      where: { batchId },
    });

    // Add new ones
    return this.prisma.inventoryNormalized.createMany({
      data: items.map((item) => ({
        ...item,
        batchId,
      })),
    });
  }
}
