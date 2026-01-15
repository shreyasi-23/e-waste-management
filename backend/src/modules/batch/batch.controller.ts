import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BatchService } from '@/services/batch.service';
import { PipelineService } from '@/services/pipeline.service';
import { StorageFactory } from '@/config/storage.config';
import {
  CreateBatchRequest,
  CreateBatchResponse,
  RunPipelineResponse,
  PipelineStatus,
  SubmitInventoryTextRequest,
  ErrorResponse,
} from '@/shared/contracts';

@Controller('api/batches')
export class BatchController {
  private readonly logger = new Logger(BatchController.name);
  private storageService = new StorageFactory(null as any).create();

  constructor(
    private batchService: BatchService,
    private pipelineService: PipelineService
  ) {}

  private errorResponse(
    code: string,
    message: string,
    details?: any
  ): ErrorResponse {
    return {
      error: {
        code,
        message,
        details,
      },
    };
  }

  @Post()
  async createBatch(@Body() dto: CreateBatchRequest): Promise<CreateBatchResponse> {
    try {
      const batch = await this.batchService.createBatch(dto.location, dto.metadata);
      return {
        id: batch.id,
        location: batch.location,
        createdAt: batch.createdAt.toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create batch';
      throw new HttpException(
        this.errorResponse('BATCH_CREATE_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/images')
  async uploadImages(
    @Param('id') batchId: string,
    @Body() body: any
  ) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) {
        throw new HttpException(
          this.errorResponse('BATCH_NOT_FOUND', `Batch ${batchId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      const uploadedIds: string[] = [];
      for (const file of body?.files || []) {
        const s3Key = `batches/${batchId}/images/${Date.now()}-${file.originalname || file.name}`;
        
        // Upload to storage
        await this.storageService.uploadBuffer(s3Key, file.buffer, file.mimetype);

        // Save metadata to DB
        const asset = await this.batchService.addImageAsset(
          batchId,
          file.originalname || file.name,
          s3Key,
          file.mimetype,
          file.size
        );
        uploadedIds.push(asset.id);
      }

      return {
        imageIds: uploadedIds,
        uploaded: uploadedIds.length,
        failed: 0,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to upload images';
      throw new HttpException(
        this.errorResponse('IMAGE_UPLOAD_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/inventory-text')
  async submitInventoryText(
    @Param('id') batchId: string,
    @Body() dto: SubmitInventoryTextRequest
  ) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) {
        throw new HttpException(
          this.errorResponse('BATCH_NOT_FOUND', `Batch ${batchId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      const entry = await this.batchService.addTextInventoryEntry(
        batchId,
        dto.text
      );

      return {
        id: entry.id,
        submittedAt: entry.submittedAt.toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit inventory';
      throw new HttpException(
        this.errorResponse('INVENTORY_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/run')
  async runPipeline(
    @Param('id') batchId: string,
    @Body() dto: { force?: boolean } = {}
  ): Promise<RunPipelineResponse> {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) {
        throw new HttpException(
          this.errorResponse('BATCH_NOT_FOUND', `Batch ${batchId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      // Run pipeline async (in production, this would be queued)
      const result = await this.pipelineService.runFullPipeline(
        batchId,
        dto.force
      );

      return {
        batchId: result.batchId,
        runId: result.runId,
        status: 'started',
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Pipeline execution failed';
      throw new HttpException(
        this.errorResponse('PIPELINE_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/status')
  async getPipelineStatus(@Param('id') batchId: string): Promise<PipelineStatus> {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) {
        throw new HttpException(
          this.errorResponse('BATCH_NOT_FOUND', `Batch ${batchId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      const latestRun = batch.pipelineRuns?.[batch.pipelineRuns.length - 1];

      if (!latestRun) {
        return {
          batchId,
          runId: '',
          currentStep: 'NOT_STARTED',
          status: 'pending',
          stepStatuses: {},
          progress: 0,
        };
      }

      // Calculate progress
      const steps = [
        'DETECTING',
        'PARSING_TEXT_INVENTORY',
        'NORMALIZING_INVENTORY',
        'ESTIMATING_METALS',
        'PRICING_METALS',
        'PLANNING_EXTRACTION',
        'GENERATING_REPORT',
        'DONE',
      ];
      const currentIndex = steps.indexOf(latestRun.currentStep);
      const progress = ((currentIndex + 1) / steps.length) * 100;

      return {
        batchId,
        runId: latestRun.id,
        currentStep: latestRun.currentStep,
        status: latestRun.status as any,
        stepStatuses: latestRun.stepResults as any,
        progress,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get status';
      throw new HttpException(
        this.errorResponse('STATUS_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/inventory')
  async getInventory(@Param('id') batchId: string) {
    try {
      const inventory = await this.batchService.getNormalizedInventory(batchId);
      return {
        inventory: inventory.map((item: any) => ({
          id: item.id,
          rawLabel: item.rawLabel,
          normalizedType: item.normalizedType,
          manufacturer: item.manufacturer,
          model: item.model,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence,
        })),
        totalItems: inventory.length,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get inventory';
      throw new HttpException(
        this.errorResponse('INVENTORY_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/report')
  async getReport(@Param('id') batchId: string) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) {
        throw new HttpException(
          this.errorResponse('BATCH_NOT_FOUND', `Batch ${batchId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      if (!batch.investorReport) {
        return this.errorResponse(
          'REPORT_NOT_READY',
          'Report not yet generated. Run pipeline first.'
        );
      }

      return batch.investorReport.reportJson;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get report';
      throw new HttpException(
        this.errorResponse('REPORT_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/detections')
  async getDetections(@Param('id') batchId: string) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch) {
        throw new HttpException(
          this.errorResponse('BATCH_NOT_FOUND', `Batch ${batchId} not found`),
          HttpStatus.NOT_FOUND
        );
      }

      const detections: any[] = [];
      for (const asset of batch.imageAssets || []) {
        if (asset.detectionResult) {
          detections.push({
            imageId: asset.id,
            labels: asset.detectionResult.summaryLabels,
            boxes: asset.detectionResult.rawBoxes,
          });
        }
      }

      return {
        imagesProcessed: batch.imageAssets?.length || 0,
        detections,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get detections';
      throw new HttpException(
        this.errorResponse('DETECTION_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/metals')
  async getMetals(@Param('id') batchId: string) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch || !batch.metalEstimate) {
        return this.errorResponse(
          'METALS_NOT_READY',
          'Metal estimates not yet available'
        );
      }

      return {
        aggregateTotalsKg: batch.metalEstimate.aggregateTotalsKg,
        uncertainty: batch.metalEstimate.uncertainty,
        citations: batch.metalEstimate.citations,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get metals';
      throw new HttpException(
        this.errorResponse('METALS_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/valuation')
  async getValuation(@Param('id') batchId: string) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch || !batch.priceSnapshot) {
        return this.errorResponse(
          'VALUATION_NOT_READY',
          'Valuation not yet available'
        );
      }

      return {
        timestampUtc: batch.priceSnapshot.timestampUtc.toISOString?.() || new Date().toISOString(),
        currency: batch.priceSnapshot.currency,
        pricesPerKg: batch.priceSnapshot.pricesPerKg,
        totalGrossValueUsd: batch.priceSnapshot.totalGrossValueUsd,
        sources: batch.priceSnapshot.sources,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get valuation';
      throw new HttpException(
        this.errorResponse('VALUATION_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/extraction')
  async getExtraction(@Param('id') batchId: string) {
    try {
      const batch = await this.batchService.getBatch(batchId);
      if (!batch || !batch.extractionPlan) {
        return this.errorResponse(
          'EXTRACTION_NOT_READY',
          'Extraction plan not yet available'
        );
      }

      return {
        totalCostUsd: batch.extractionPlan.totalCostUsd,
        netProfitUsd: batch.extractionPlan.netProfitUsd,
        plan: batch.extractionPlan,
        risks: batch.extractionPlan.risks,
        citations: batch.extractionPlan.citations,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to get extraction plan';
      throw new HttpException(
        this.errorResponse('EXTRACTION_ERROR', msg),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
