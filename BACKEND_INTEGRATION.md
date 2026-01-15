# Backend Integration Guide

## Frontend-Backend Contract

This backend is designed to be consumed directly by your React frontend with full TypeScript type safety.

### Importing Shared Types

In your frontend (`src/`), you can import backend types and contracts:

```typescript
// src/api/client.ts
import type {
  CreateBatchRequest,
  CreateBatchResponse,
  RunPipelineResponse,
  InvestorReport,
  InventoryItem,
} from '@backend/shared/contracts';

// Now all API responses are fully typed
const response = await fetch('/api/batches/:id/report');
const report: InvestorReport = await response.json();
```

### API Client Setup

Create a typed API client in your frontend:

```typescript
// src/services/api.ts
import type {
  CreateBatchRequest,
  CreateBatchResponse,
  RunPipelineResponse,
  PipelineStatus,
  BatchInventoryResponse,
} from '@backend/shared/contracts';

const API_BASE = 'http://localhost:3000/api';

export const batchApi = {
  async createBatch(
    req: CreateBatchRequest
  ): Promise<CreateBatchResponse> {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.json();
  },

  async uploadImages(
    batchId: string,
    files: File[]
  ): Promise<{ imageIds: string[]; uploaded: number }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const res = await fetch(`${API_BASE}/batches/${batchId}/images`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async submitTextInventory(
    batchId: string,
    text: string
  ): Promise<{ id: string; submittedAt: string }> {
    const res = await fetch(`${API_BASE}/batches/${batchId}/inventory-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async runPipeline(batchId: string): Promise<RunPipelineResponse> {
    const res = await fetch(`${API_BASE}/batches/${batchId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.json();
  },

  async getPipelineStatus(batchId: string): Promise<PipelineStatus> {
    const res = await fetch(`${API_BASE}/batches/${batchId}/status`);
    return res.json();
  },

  async getReport(batchId: string) {
    const res = await fetch(`${API_BASE}/batches/${batchId}/report`);
    return res.json();
  },

  async getInventory(batchId: string): Promise<BatchInventoryResponse> {
    const res = await fetch(`${API_BASE}/batches/${batchId}/inventory`);
    return res.json();
  },

  async getDetections(batchId: string) {
    const res = await fetch(`${API_BASE}/batches/${batchId}/detections`);
    return res.json();
  },

  async getMetals(batchId: string) {
    const res = await fetch(`${API_BASE}/batches/${batchId}/metals`);
    return res.json();
  },

  async getValuation(batchId: string) {
    const res = await fetch(`${API_BASE}/batches/${batchId}/valuation`);
    return res.json();
  },

  async getExtraction(batchId: string) {
    const res = await fetch(`${API_BASE}/batches/${batchId}/extraction`);
    return res.json();
  },
};
```

### React Hook for Pipeline Execution

```typescript
// src/hooks/usePipeline.ts
import { useState, useCallback } from 'react';
import { batchApi } from '@/services/api';
import type {
  RunPipelineResponse,
  PipelineStatus,
  InvestorReport,
} from '@backend/shared/contracts';

export function usePipeline(batchId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [report, setReport] = useState<InvestorReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = useCallback(async () => {
    try {
      setIsRunning(true);
      setError(null);

      // Start pipeline
      const result: RunPipelineResponse = await batchApi.runPipeline(
        batchId
      );

      // Poll status
      const pollInterval = setInterval(async () => {
        const currentStatus = await batchApi.getPipelineStatus(batchId);
        setStatus(currentStatus);
        setProgress(currentStatus.progress);

        if (currentStatus.progress === 100) {
          clearInterval(pollInterval);

          // Fetch final report
          const finalReport = await batchApi.getReport(batchId);
          setReport(finalReport);

          setIsRunning(false);
        }
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Pipeline execution failed'
      );
      setIsRunning(false);
    }
  }, [batchId]);

  return {
    isRunning,
    progress,
    status,
    report,
    error,
    runPipeline,
  };
}
```

### Updated React Components

Update your `App.tsx` to integrate with the backend:

```typescript
// src/App.tsx
import { useState } from 'react';
import './App.css';
import EWasteForm from './components/EWasteForm';
import Results from './components/Results';
import type { EWasteData, AnalysisResult } from './types';
import { batchApi } from './services/api';
import { usePipeline } from './hooks/usePipeline';
import type { InvestorReport } from '@backend/shared/contracts';

function App() {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<InvestorReport | null>(
    null
  );
  const { runPipeline, progress, isRunning } = usePipeline(batchId || '');

  const handleFormSubmit = async (data: EWasteData) => {
    try {
      setIsAnalyzing(true);

      // 1. Create batch
      const batch = await batchApi.createBatch({
        location: 'USA',
        metadata: { source: 'frontend-upload' },
      });
      setBatchId(batch.id);

      // 2. Upload images if provided
      if (data.images && data.images.length > 0) {
        await batchApi.uploadImages(batch.id, data.images);
      }

      // 3. Submit text inventory
      const inventoryText =
        `${data.type} - ${data.quantity}` +
        (data.weight ? `, ${data.weight}kg` : '') +
        (data.additionalInfo ? `, ${data.additionalInfo}` : '');
      await batchApi.submitTextInventory(batch.id, inventoryText);

      // 4. Run pipeline
      await runPipeline();
    } catch (error) {
      console.error('Failed to submit form:', error);
      setIsAnalyzing(false);
    }
  };

  const handleNewAnalysis = () => {
    setBatchId(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  // Show progress while pipeline is running
  if (isRunning && batchId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Analyzing E-Waste...</h2>
        <div
          style={{
            width: '100%',
            height: '20px',
            background: '#eee',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#4CAF50',
              transition: 'width 0.3s',
            }}
          />
        </div>
        <p>{progress}% Complete</p>
      </div>
    );
  }

  return (
    <div>
      {analysisResult ? (
        <Results result={analysisResult} onNewAnalysis={handleNewAnalysis} />
      ) : (
        <EWasteForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} />
      )}
    </div>
  );
}

export default App;
```

## Environment Setup

### Frontend .env

```bash
# .env (frontend)
VITE_API_URL=http://localhost:3000/api
```

### Backend .env

```bash
# .env (backend)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ewaste_db
REDIS_HOST=localhost
REDIS_PORT=6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=ewaste-images
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
DETECTOR_TYPE=stub
STORAGE_TYPE=minio
LOG_LEVEL=debug
```

## Development Workflow

1. **Start Backend Services**:
   ```bash
   cd backend
   docker-compose up -d
   npm run dev
   ```

2. **Start Frontend Development Server** (in root):
   ```bash
   npm run dev
   ```

3. **Test Integration**:
   - Navigate to http://localhost:5173
   - Fill in the form
   - Upload images (optional)
   - Submit and watch pipeline progress
   - View final report

## Error Handling

All API errors follow the same format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

Handle errors in frontend:

```typescript
try {
  const response = await fetch('/api/batches/:id/run', { method: 'POST' });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message);
  }
  const data = await response.json();
} catch (error) {
  console.error('API Error:', error);
}
```

## Debugging

### Backend Logs

```bash
docker-compose logs -f backend
```

### Database Inspection

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/ewaste_db

# View batches
SELECT id, location, "createdAt" FROM "Batch";

# View pipeline runs
SELECT id, "batchId", "currentStep", status FROM "PipelineRun" ORDER BY "startedAt" DESC;
```

### MinIO Console

- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin
- Browse uploaded images in `ewaste-images` bucket

## Production Deployment

### Docker Image

```bash
cd backend
docker build -t your-registry/ewaste-backend:latest .
docker push your-registry/ewaste-backend:latest
```

### Environment Variables

Update for production:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:prod-pass@prod-db:5432/ewaste_prod
REDIS_HOST=prod-redis.internal
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
STORAGE_TYPE=s3
GEMINI_API_KEY=your-prod-api-key
```

### Kubernetes Deployment

See `k8s/` directory for example deployments.
