import { Test, TestingModule } from '@nestjs/testing';

// ✅ Use relative imports so tests don't depend on tsconfig/jest path mapping
import { BatchController } from '../src/modules/batch/batch.controller';
import { BatchService } from '../src/services/batch.service';
import { PipelineService } from '../src/services/pipeline.service';

// ✅ Mock Google Generative AI before importing services that depend on it
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn(() => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => '{}',
          },
        }),
      })),
    })),
  };
});

// ✅ IMPORTANT: Your controller does `new StorageFactory(null as any).create()`
// in a class field initializer. Mock StorageFactory so tests don't crash.
jest.mock('../src/config/storage.config', () => {
  return {
    StorageFactory: jest.fn().mockImplementation(() => ({
      create: () => ({
        uploadBuffer: jest.fn().mockResolvedValue(undefined),
      }),
    })),
  };
});

describe('BatchController (unit)', () => {
  let controller: BatchController;
  let batchService: jest.Mocked<BatchService>;
  let pipelineService: jest.Mocked<PipelineService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [
        {
          provide: BatchService,
          useValue: {
            createBatch: jest.fn(),
            getBatch: jest.fn(),
            addTextInventoryEntry: jest.fn(),
            addImageAsset: jest.fn(),
            getNormalizedInventory: jest.fn(),
          },
        },
        {
          provide: PipelineService,
          useValue: {
            runFullPipeline: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(BatchController);
    batchService = module.get(BatchService) as any;
    pipelineService = module.get(PipelineService) as any;
  });

  describe('createBatch', () => {
    it('should create a batch with location and metadata', async () => {
      const mockBatch = {
        id: 'batch-123',
        location: 'California',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      batchService.createBatch.mockResolvedValue(mockBatch as any);

      const result = await controller.createBatch({
        location: 'California',
        metadata: { source: 'facility-A' },
      } as any);

      expect(result.id).toBe('batch-123');
      expect(result.location).toBe('California');
      expect(batchService.createBatch).toHaveBeenCalledWith('California', {
        source: 'facility-A',
      });
      expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('submitInventoryText', () => {
    it('should submit text inventory entry', async () => {
      batchService.getBatch.mockResolvedValue({ id: 'batch-123' } as any);
      batchService.addTextInventoryEntry.mockResolvedValue({
        id: 'entry-123',
        submittedAt: new Date('2026-01-02T00:00:00.000Z'),
      } as any);

      const result = await controller.submitInventoryText('batch-123', {
        text: 'Intel Core i7 laptops - 10',
      } as any);

      expect(result.id).toBe('entry-123');
      expect(batchService.addTextInventoryEntry).toHaveBeenCalledWith(
        'batch-123',
        'Intel Core i7 laptops - 10'
      );
      expect(result.submittedAt).toBe('2026-01-02T00:00:00.000Z');
    });
  });

  describe('runPipeline', () => {
    it('should run pipeline and return runId', async () => {
      batchService.getBatch.mockResolvedValue({ id: 'batch-123' } as any);
      pipelineService.runFullPipeline.mockResolvedValue({
        batchId: 'batch-123',
        runId: 'run-456',
      } as any);

      const result = await controller.runPipeline('batch-123', {});

      expect(result.batchId).toBe('batch-123');
      expect(result.runId).toBe('run-456');
      expect(result.status).toBe('started');

      // controller passes (batchId, dto.force). Here dto.force is undefined.
      expect(pipelineService.runFullPipeline).toHaveBeenCalledWith(
        'batch-123',
        undefined
      );
    });
  });

  describe('getInventory', () => {
    it('should return normalized inventory', async () => {
      batchService.getNormalizedInventory.mockResolvedValue([
        {
          id: 'item-1',
          rawLabel: 'Intel Core i7',
          normalizedType: 'laptop',
          manufacturer: 'Intel',
          model: 'i7-10700K',
          quantity: 10,
          unit: 'count',
          confidence: 'high',
        },
      ] as any);

      const result = await controller.getInventory('batch-123');

      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0].normalizedType).toBe('laptop');
      expect(result.totalItems).toBe(1);
      expect(typeof result.lastUpdated).toBe('string');
    });
  });
});
