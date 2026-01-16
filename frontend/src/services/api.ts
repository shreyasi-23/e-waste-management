import type { EWasteData, AnalysisResult } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export async function analyzeEWaste(data: EWasteData): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ewasteData: {
        type: data.type,
        quantity: data.quantity,
        weight: data.weight,
        condition: data.condition,
        parts: data.parts,
        additionalInfo: data.additionalInfo,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze e-waste data');
  }

  return response.json();
}
