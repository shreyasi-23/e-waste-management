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

export interface RecyclingCenter {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  phone?: string;
  website?: string;
  acceptedTypes: string[]; // e.g., ['Batteries', 'Computers', 'Phones']
  hours?: string;
  distance?: number; // in miles/km from user
  rating?: number;
  isOpen?: boolean;
}
