// Re-export all types and schemas for frontend consumption
export * from './schemas';

// ============================================================================
// ERROR CONTRACT
// ============================================================================

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

export interface CreateBatchRequest {
  location?: string;
  metadata?: Record<string, any>;
}

export interface CreateBatchResponse {
  id: string;
  location: string;
  createdAt: string;
}

export interface UploadImagesRequest {
  images: any[]; // File[]
}

export interface UploadImagesResponse {
  imageIds: string[];
  uploaded: number;
  failed: number;
}

export interface SubmitInventoryTextRequest {
  text: string;
}

export interface SubmitInventoryTextResponse {
  id: string;
  submittedAt: string;
}

export interface RunPipelineRequest {
  force?: boolean;
}

export interface RunPipelineResponse {
  batchId: string;
  runId: string;
  status: 'started' | 'queued';
}

export interface PipelineStatus {
  batchId: string;
  runId: string;
  currentStep: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  stepStatuses: Record<string, any>;
  progress: number; // 0-100
  error?: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface BatchInventoryResponse {
  inventory: Array<{
    id: string;
    rawLabel: string;
    normalizedType: string;
    manufacturer?: string;
    model?: string;
    quantity: number;
    unit: string;
    confidence: string;
  }>;
  totalItems: number;
  lastUpdated: string;
}

export interface BatchDetectionsResponse {
  imagesProcessed: number;
  detections: Array<{
    imageId: string;
    labels: Array<{
      label: string;
      count: number;
      confidenceMean: number;
    }>;
    boxes: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
      label: string;
    }>;
  }>;
}

export interface BatchMetalsResponse {
  aggregateTotalsKg: Record<string, number>;
  uncertainty: Record<string, string>;
  citations: Array<{
    source?: string;
    url?: string;
    title?: string;
  }>;
}

export interface BatchValuationResponse {
  timestampUtc: string;
  currency: string;
  pricesPerKg: Record<string, number>;
  totalGrossValueUsd: number;
  sources: Array<{
    source?: string;
    url?: string;
  }>;
}

export interface BatchExtractionResponse {
  totalCostUsd: number;
  netProfitUsd: number;
  plan: any;
  risks: any[];
  citations: any[];
}
