import type { EWasteData, AnalysisResult } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export async function analyzeEWaste(data: EWasteData): Promise<AnalysisResult> {
  // Convert images to base64 strings (properly awaited)
  const imagePromises = data.images.map(file => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extract base64 data without the data URL prefix
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove "data:image/...;base64,"
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  const images = await Promise.all(imagePromises);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images,
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
