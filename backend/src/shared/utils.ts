export function hashString(text: string): string {
  // Simplified hash - in real implementation use crypto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return Math.abs(hash).toString(16);
}

export function hashJson(obj: any): string {
  return hashString(JSON.stringify(obj));
}

export interface Detector {
  detect(image: any): Promise<DetectionOutput>;
}

export interface DetectionOutput {
  rawBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    label: string;
  }>;
  summaryLabels: Array<{
    label: string;
    count: number;
    confidenceMean: number;
  }>;
  modelVersion: string;
}

/**
 * Stub detector for local development
 * Returns deterministic detections for testing
 */
export class StubDetector implements Detector {
  async detect(image: any): Promise<DetectionOutput> {
    // Simulate detection based on image content
    const commonEWasteLabels = [
      'cpu',
      'ram',
      'pcb',
      'battery',
      'cable',
      'display',
      'power_supply',
    ];

    const randomLabels = commonEWasteLabels.slice(
      0,
      Math.floor(Math.random() * 3) + 2
    );
    const summaryLabels = randomLabels.map((label) => ({
      label,
      count: Math.floor(Math.random() * 5) + 1,
      confidenceMean: Math.random() * 0.3 + 0.65, // 0.65-0.95
    }));

    const rawBoxes = [];
    for (const label of randomLabels) {
      const boxCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < boxCount; i++) {
        rawBoxes.push({
          x: Math.random() * 640,
          y: Math.random() * 480,
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50,
          confidence: Math.random() * 0.3 + 0.65,
          label,
        });
      }
    }

    return {
      rawBoxes,
      summaryLabels,
      modelVersion: 'stub-v1',
    };
  }
}

export function parseTextInventory(text: string): Array<{
  rawLabel: string;
  quantity: number;
  unit: string;
  confidence: string;
}> {
  const items: Array<{
    rawLabel: string;
    quantity: number;
    unit: string;
    confidence: string;
  }> = [];

  const lines = text
    .split(/[,\n;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    // Match patterns like "intel core GPU powered lenovo laptops - 10"
    // or "iphone 6 - 8"
    const match = line.match(/^(.+?)\s*-\s*(\d+(?:\.\d+)?)\s*(.*)$/);
    if (match) {
      const [, label, qtyStr, unit] = match;
      const quantity = parseFloat(qtyStr);

      items.push({
        rawLabel: label.trim(),
        quantity,
        unit: unit.trim() || 'count',
        confidence: 'high',
      });
    } else {
      // Try to extract just a label and number
      const simpleMatch = line.match(/(\d+(?:\.\d+)?)\s+(.+)/);
      if (simpleMatch) {
        const [, qtyStr, label] = simpleMatch;
        items.push({
          rawLabel: label.trim(),
          quantity: parseFloat(qtyStr),
          unit: 'count',
          confidence: 'high',
        });
      }
    }
  }

  return items;
}

export function normalizeEWasteType(
  label: string
): 'laptop' | 'smartphone' | 'pcb' | 'battery' | 'cable' | 'other' {
  const lower = label.toLowerCase();

  // Laptop detection
  if (
    lower.includes('laptop') ||
    lower.includes('computer') ||
    lower.includes('notebook')
  ) {
    return 'laptop';
  }

  // Smartphone detection
  if (
    lower.includes('phone') ||
    lower.includes('iphone') ||
    lower.includes('android')
  ) {
    return 'smartphone';
  }

  // PCB detection
  if (lower.includes('pcb') || lower.includes('board') || lower.includes('circuit')) {
    return 'pcb';
  }

  // Battery detection
  if (lower.includes('battery') || lower.includes('cell')) {
    return 'battery';
  }

  // Cable detection
  if (lower.includes('cable') || lower.includes('wire') || lower.includes('cord')) {
    return 'cable';
  }

  return 'other';
}
