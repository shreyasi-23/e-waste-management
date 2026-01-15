# E-Waste Management Backend

A production-ready NestJS + Fastify backend for intelligent e-waste management and material recovery analysis using Gemini AI.

## Features

- **Image-based Detection**: Analyze e-waste images for material identification
- **Text Inventory Parsing**: Parse freeform text inventory entries
- **AI-Driven Analysis**: 
  - Metal composition estimation (Gemini Agent #1)
  - Market price analysis (Gemini Agent #2)
  - Extraction strategy planning (Gemini Agent #3)
- **Comprehensive Reporting**: Generate investor-ready reports with financial analysis
- **Multi-step Pipeline**: Idempotent state machine with step-by-step tracking
- **Type-Safe**: Full TypeScript with Zod schema validation
- **Storage**: MinIO (dev) or AWS S3 (prod)
- **Database**: PostgreSQL + Prisma ORM
- **Queuing**: Redis + BullMQ for background jobs (extensible)

## Tech Stack

- **Framework**: NestJS with Fastify adapter
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma
- **Cache/Queue**: Redis + BullMQ
- **Storage**: MinIO / AWS S3
- **AI**: Google Gemini API
- **Validation**: Zod schemas
- **Docker**: Docker Compose for local development

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Google Gemini API Key

### Local Setup

1. **Clone and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Add your Gemini API Key**:
   ```bash
   # Edit .env and add:
   GEMINI_API_KEY=your_actual_key_here
   ```

4. **Start services with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

5. **Run Prisma migrations**:
   ```bash
   npm run prisma:migrate
   ```

6. **Start the backend**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Batch Management

**Create Batch**
```bash
curl -X POST http://localhost:3000/api/batches \
  -H "Content-Type: application/json" \
  -d '{
    "location": "California",
    "metadata": { "source": "facility-A" }
  }'
```
Response:
```json
{
  "id": "clx1234567890abc",
  "location": "California",
  "createdAt": "2024-01-14T10:00:00Z"
}
```

**Upload Images**
```bash
curl -X POST http://localhost:3000/api/batches/:id/images \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

**Submit Text Inventory**
```bash
curl -X POST http://localhost:3000/api/batches/:id/inventory-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Intel Core i7 laptops - 10, iPhone 6 - 8, PCB boards - 50kg"
  }'
```

**Run Pipeline**
```bash
curl -X POST http://localhost:3000/api/batches/:id/run \
  -H "Content-Type: application/json" \
  -d '{ "force": false }'
```
Response:
```json
{
  "batchId": "clx1234567890abc",
  "runId": "run_123456",
  "status": "started"
}
```

**Check Pipeline Status**
```bash
curl http://localhost:3000/api/batches/:id/status
```
Response:
```json
{
  "batchId": "clx1234567890abc",
  "runId": "run_123456",
  "currentStep": "PRICING_METALS",
  "status": "in_progress",
  "progress": 60,
  "stepStatuses": {
    "DETECTING": { "status": "completed", "duration": 2345 },
    "NORMALIZING_INVENTORY": { "status": "completed", "duration": 1234 }
  }
}
```

### Results

**Get Full Report**
```bash
curl http://localhost:3000/api/batches/:id/report
```

**Get Inventory**
```bash
curl http://localhost:3000/api/batches/:id/inventory
```

**Get Detections**
```bash
curl http://localhost:3000/api/batches/:id/detections
```

**Get Metal Estimates**
```bash
curl http://localhost:3000/api/batches/:id/metals
```

**Get Valuation**
```bash
curl http://localhost:3000/api/batches/:id/valuation
```

**Get Extraction Plan**
```bash
curl http://localhost:3000/api/batches/:id/extraction
```

## Pipeline Architecture

The pipeline executes in the following sequence:

```
DETECTING
    ↓
PARSING_TEXT_INVENTORY
    ↓
NORMALIZING_INVENTORY (merges image + text)
    ↓
ESTIMATING_METALS (Gemini Agent #1)
    ↓
PRICING_METALS (Gemini Agent #2, grounded web search)
    ↓
PLANNING_EXTRACTION (Gemini Agent #3, grounded web search)
    ↓
GENERATING_REPORT (deterministic report builder)
    ↓
DONE
```

Each step:
- Is **idempotent** (can be safely retried)
- **Stores results** in the database
- **Tracks errors** with detailed logging
- Can be **skipped** if outputs already exist (unless `force=true`)

## Type Safety & Contracts

All API responses and Gemini outputs are validated against Zod schemas defined in `src/shared/contracts/`:

```typescript
// Example: Metal estimation output validated against schema
const { data, meta } = await geminiService.generateJson<MetalEstimateOutput>(
  prompt,
  MetalEstimateOutputSchema
);
// data is guaranteed to match the schema or an error is thrown
```

## Frontend Integration

The backend is designed for seamless TypeScript frontend integration:

### Types & Schemas
All frontend types are available in `backend/src/shared/contracts/`:

```typescript
// Frontend can import and use backend types
import type { InvestorReport, InventoryItem } from '@backend/shared/contracts';
```

### Error Format
All error responses follow a consistent format:
```json
{
  "error": {
    "code": "BATCH_NOT_FOUND",
    "message": "Batch clx123 not found",
    "details": {}
  }
}
```

### Response Shapes
Frontend receives predictable, schema-validated responses:
- No untyped JSON blobs
- All optional fields are explicit
- Enum values are consistent
- Metadata includes timestamps and model versions

## Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ewaste_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Storage (MinIO for dev, S3 for prod)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=ewaste-images
STORAGE_TYPE=minio

# Gemini AI
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.0-flash
GEMINI_ENABLE_GROUNDING=true

# Detection
DETECTOR_TYPE=stub  # or: yolo, api
DETECTOR_ENDPOINT=http://localhost:8000

# Logging
LOG_LEVEL=debug
```

## Database Schema

Key tables:

- **Batch**: Root entity containing location and metadata
- **ImageAsset**: Uploaded e-waste images with S3 keys
- **DetectionResult**: Object detection outputs (boxes, labels, confidence)
- **TextInventoryEntry**: Freeform text inventory submissions
- **InventoryNormalized**: Parsed, canonicalized inventory items
- **MetalEstimate**: Gemini Agent #1 output (composition, totals, uncertainty)
- **PriceSnapshot**: Gemini Agent #2 output (prices, gross value, sources)
- **ExtractionPlan**: Gemini Agent #3 output (processes, costs, timeline, risks)
- **InvestorReport**: Final investor-ready report (JSON)
- **PipelineRun**: Step-by-step execution audit trail

## Testing

### Run Tests
```bash
npm test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Manual Test Workflow

```bash
# 1. Create batch
BATCH_ID=$(curl -s -X POST http://localhost:3000/api/batches \
  -H "Content-Type: application/json" \
  -d '{"location":"test"}' | jq -r '.id')

# 2. Submit text inventory
curl -X POST http://localhost:3000/api/batches/$BATCH_ID/inventory-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Intel i7 laptop - 5, iPhone 6s - 10, Copper wire - 2kg"
  }'

# 3. Run pipeline
RUN_ID=$(curl -s -X POST http://localhost:3000/api/batches/$BATCH_ID/run \
  -H "Content-Type: application/json" | jq -r '.runId')

# 4. Poll status
for i in {1..60}; do
  STATUS=$(curl -s http://localhost:3000/api/batches/$BATCH_ID/status | jq '.progress')
  echo "Progress: $STATUS%"
  if [ "$STATUS" = "100" ]; then break; fi
  sleep 2
done

# 5. Fetch report
curl -s http://localhost:3000/api/batches/$BATCH_ID/report | jq '.'
```

## Extending the Backend

### Adding a New Gemini Agent

1. Define Zod schema in `src/shared/contracts/schemas.ts`
2. Implement pipeline step in `src/services/pipeline.service.ts`
3. Create endpoint in `src/modules/batch/batch.controller.ts`
4. Add to `src/services/pipeline.service.ts` execution sequence

### Using Production S3

Update `.env`:
```bash
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your_aws_access_key
S3_SECRET_KEY=your_aws_secret_key
S3_REGION=us-east-1
```

### Implementing Real Detection

Replace `StubDetector` in `src/services/pipeline.service.ts`:

```typescript
// Option 1: Python YOLO microservice
class YOLODetector implements Detector {
  async detect(image: Buffer): Promise<DetectionOutput> {
    const response = await axios.post('http://yolo:8000/detect', 
      { image: image.toString('base64') }
    );
    return response.data;
  }
}

// Option 2: Hosted detector API
class HostedDetector implements Detector {
  async detect(image: Buffer): Promise<DetectionOutput> {
    // Call your hosted detection service
  }
}
```

## Performance Considerations

- **Gemini Rate Limits**: Implement exponential backoff (already in place)
- **Image Processing**: Consider resizing large images before upload
- **Pipeline Timeouts**: Default is 30s per step
- **Database Indexing**: Indexes on `batchId`, `status`, `createdAt`
- **Caching**: Consider Redis caching for pricing snapshots

## Production Deployment

### Docker Build & Push
```bash
docker build -t myregistry/ewaste-backend:latest .
docker push myregistry/ewaste-backend:latest
```

### Kubernetes Deployment
See `k8s/` directory for example manifests.

### Environment Setup
```bash
# Use AWS S3 instead of MinIO
export STORAGE_TYPE=s3
export S3_ENDPOINT=https://s3.amazonaws.com

# Use production Gemini model
export GEMINI_MODEL=gemini-2.0-flash

# Enable grounding for all agents
export GEMINI_ENABLE_GROUNDING=true

# Database: use managed PostgreSQL
export DATABASE_URL=postgres://user:pass@rds-instance:5432/ewaste_prod
```

## Troubleshooting

### Gemini API Errors
- Check API key in `.env`
- Verify API is enabled in Google Cloud Console
- Check quota and rate limits
- Review error logs: `docker logs backend`

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection
psql postgresql://postgres:postgres@localhost:5432/ewaste_db
```

### MinIO Issues
- Access console: http://localhost:9001
- Default credentials: minioadmin / minioadmin
- Check bucket exists: `ewaste-images`

### Pipeline Failures
- Check status endpoint for detailed error messages
- Review pipeline step outputs in database
- Check `stepResults` JSON in `PipelineRun` table

## Support

For issues or questions:
1. Check this README
2. Review API documentation
3. Examine error responses
4. Check backend logs: `docker-compose logs -f backend`

## License

Proprietary - E-Waste Management System
