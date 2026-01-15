import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from '@/services/batch.service';
import { PipelineService } from '@/services/pipeline.service';

@Module({
  controllers: [BatchController],
  providers: [BatchService, PipelineService],
  exports: [BatchService, PipelineService],
})
export class BatchModule {}
