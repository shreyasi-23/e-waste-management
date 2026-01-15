import { z } from 'zod';

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export enum InventoryType {
  LAPTOP = 'laptop',
  SMARTPHONE = 'smartphone',
  PCB = 'pcb',
  BATTERY = 'battery',
  CABLE = 'cable',
  OTHER = 'other',
}

export enum Unit {
  COUNT = 'count',
  KG = 'kg',
  TONS = 'tons',
}

export enum Confidence {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum Verdict {
  VIABLE = 'Viable',
  NOT_VIABLE = 'NotViable',
  UNCERTAIN = 'Uncertain',
}

// ============================================================================
// INVENTORY ITEM
// ============================================================================

export const InventoryItemSchema = z.object({
  rawLabel: z.string(),
  normalizedType: z.nativeEnum(InventoryType),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  quantity: z.number().int().positive(),
  unit: z.nativeEnum(Unit),
  confidence: z.nativeEnum(Confidence),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// ============================================================================
// DETECTION
// ============================================================================

export const BoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  confidence: z.number().min(0).max(1),
  label: z.string(),
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const DetectionLabelSchema = z.object({
  label: z.string(),
  count: z.number().int().nonnegative(),
  confidenceMean: z.number().min(0).max(1),
});

export type DetectionLabel = z.infer<typeof DetectionLabelSchema>;

export const DetectionOutputSchema = z.object({
  rawBoxes: z.array(BoundingBoxSchema),
  summaryLabels: z.array(DetectionLabelSchema),
  modelVersion: z.string(),
});

export type DetectionOutput = z.infer<typeof DetectionOutputSchema>;

// ============================================================================
// CITATIONS
// ============================================================================

export const CitationSchema = z.object({
  source: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  date: z.string().optional(),
  confidence: z.nativeEnum(Confidence).optional(),
});

export type Citation = z.infer<typeof CitationSchema>;

// ============================================================================
// METAL ESTIMATION (Gemini Agent #1)
// ============================================================================

export const MetalCompositionSchema = z.record(
  z.string(),
  z.object({
    grams: z.number().nonnegative(),
    confidence: z.nativeEnum(Confidence),
  })
);

export const MetalEstimateOutputSchema = z.object({
  composition: MetalCompositionSchema,
  aggregateTotalsKg: z.record(z.string(), z.number().nonnegative()),
  uncertainty: z.record(z.string(), z.nativeEnum(Confidence)),
  citations: z.array(CitationSchema),
});

export type MetalEstimateOutput = z.infer<typeof MetalEstimateOutputSchema>;

// ============================================================================
// PRICING SNAPSHOT (Gemini Agent #2)
// ============================================================================

export const PriceSnapshotSchema = z.object({
  timestampUtc: z.string().datetime(),
  currency: z.literal('USD'),
  pricesPerKg: z.record(z.string(), z.number().positive()),
  totalGrossValueUsd: z.number().nonnegative(),
  sources: z.array(CitationSchema),
});

export type PriceSnapshot = z.infer<typeof PriceSnapshotSchema>;

// ============================================================================
// EXTRACTION PLAN (Gemini Agent #3)
// ============================================================================

export const ExtractionRiskSchema = z.object({
  category: z.string(),
  description: z.string(),
  mitigationStrategy: z.string().optional(),
  impactLevel: z.enum(['low', 'medium', 'high']),
});

export const ExtractionSensitivitySchema = z.object({
  bestCase: z.number(),
  baseCase: z.number(),
  worstCase: z.number(),
  assumptions: z.array(z.string()).optional(),
});

export const ExtractionPlanSchema = z.object({
  recommendedProcesses: z.array(
    z.object({
      metalType: z.string(),
      process: z.string(),
      duration: z.string(),
      yield: z.number().min(0).max(100),
    })
  ),
  totalCostUsd: z.number().nonnegative(),
  capexUsd: z.number().nonnegative(),
  opexUsd: z.number().nonnegative(),
  logisticsCostUsd: z.number().nonnegative(),
  timeline: z.object({
    phases: z.array(
      z.object({
        name: z.string(),
        duration: z.string(),
        activities: z.array(z.string()),
      })
    ),
  }),
  risks: z.array(ExtractionRiskSchema),
  sensitivity: ExtractionSensitivitySchema,
  netProfitUsd: z.number(),
  citations: z.array(CitationSchema),
});

export type ExtractionPlan = z.infer<typeof ExtractionPlanSchema>;

// ============================================================================
// INVESTOR REPORT (FRONTEND-READY)
// ============================================================================

export const InvestorReportSchema = z.object({
  executiveSummary: z.object({
    grossValueUsd: z.number().nonnegative(),
    totalCostUsd: z.number().nonnegative(),
    netProfitUsd: z.number(),
    verdict: z.nativeEnum(Verdict),
    confidence: z.nativeEnum(Confidence),
  }),
  inventory: z.array(InventoryItemSchema),
  detections: z
    .object({
      imagesProcessed: z.number().int().nonnegative(),
      labels: z.array(DetectionLabelSchema),
    })
    .optional(),
  metals: z.object({
    aggregateTotalsKg: z.record(z.string(), z.number().nonnegative()),
    uncertainty: z.record(z.string(), z.nativeEnum(Confidence)),
    citations: z.array(CitationSchema),
  }),
  pricing: z.object({
    timestampUtc: z.string().datetime(),
    currency: z.literal('USD'),
    pricesPerKg: z.record(z.string(), z.number().positive()),
    totalGrossValueUsd: z.number().nonnegative(),
    sources: z.array(CitationSchema),
  }),
  extraction: z.object({
    totalCostUsd: z.number().nonnegative(),
    netProfitUsd: z.number(),
    plan: z.unknown(), // Validated ExtractionPlan
    risks: z.array(z.unknown()),
    sensitivity: z.unknown(),
    citations: z.array(CitationSchema),
  }),
  auditTrail: z.object({
    detectorVersion: z.string(),
    llmModels: z.record(z.string(), z.string()),
    promptHashes: z.record(z.string(), z.string()),
    createdAtUtc: z.string().datetime(),
  }),
});

export type InvestorReport = z.infer<typeof InvestorReportSchema>;

// ============================================================================
// LLM METADATA
// ============================================================================

export const LlmMetaSchema = z.object({
  modelName: z.string(),
  promptHash: z.string().optional(),
  responseHash: z.string().optional(),
  latencyMs: z.number().nonnegative(),
  citations: z.array(CitationSchema).optional(),
  retryCount: z.number().nonnegative().optional(),
});

export type LlmMeta = z.infer<typeof LlmMetaSchema>;

// ============================================================================
// PIPELINE STATE
// ============================================================================

export enum PipelineStepName {
  DETECTING = 'DETECTING',
  PARSING_TEXT_INVENTORY = 'PARSING_TEXT_INVENTORY',
  NORMALIZING_INVENTORY = 'NORMALIZING_INVENTORY',
  ESTIMATING_METALS = 'ESTIMATING_METALS',
  PRICING_METALS = 'PRICING_METALS',
  PLANNING_EXTRACTION = 'PLANNING_EXTRACTION',
  GENERATING_REPORT = 'GENERATING_REPORT',
  DONE = 'DONE',
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const PipelineStepResultSchema = z.object({
  status: z.nativeEnum(StepStatus),
  output: z.unknown().optional(),
  error: z.string().optional(),
  duration: z.number().nonnegative().optional(),
  timestamp: z.string().datetime(),
});

export type PipelineStepResult = z.infer<typeof PipelineStepResultSchema>;
