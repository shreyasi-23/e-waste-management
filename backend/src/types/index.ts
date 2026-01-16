// Request body types (what the backend receives)
export interface EWasteRequestBody {
  images?: string[]; // Base64 encoded image strings
  ewasteData: {
    type: string;
    quantity: number;
    weight: number;
    condition: string;
    parts?: string;
    additionalInfo: string;
  };
}

// Response types (what the backend returns)
export interface EconomicOpportunity {
  category: string;
  estimatedValue: string;
  materials: string[];
  recyclingPotential: string;
  recommendations: string[];
}

export interface AnalysisResult {
  totalEstimatedValue: string;
  summary: string;
  environmentalImpact: string;
  opportunities: EconomicOpportunity[];
}

// Error response type
export interface ErrorResponse {
  error: string;
  details?: string;
}

// Recycler types
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
  acceptedTypes: string[];
  hours?: string;
  distance?: number;
  rating?: number;
  isOpen?: boolean;
}

export interface NearbyRecyclersQuery {
  lat: string;
  lng: string;
  radius?: string;
  type?: string;
}

// Google Places API types
export interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  rating?: number;
  types?: string[];
}
