export interface EWasteData {
  images: File[];
  type: string;
  quantity: number;
  weight: number;
  condition: string;
  parts?: string;
  additionalInfo: string;
}

export interface EconomicOpportunity {
  category: string;
  estimatedValue: string;
  materials: string[];
  recommendations: string[];
  recyclingPotential: string;
}

export interface AnalysisResult {
  totalEstimatedValue: string;
  opportunities: EconomicOpportunity[];
  summary: string;
  environmentalImpact: string;
}
