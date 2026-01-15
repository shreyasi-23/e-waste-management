import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from '@/services/batch.service';
import { PipelineService } from '@/services/pipeline.service';
import { AppConfigService } from '@/config/app.config';

@Module({
  controllers: [BatchController],
  providers: [BatchService, PipelineService, AppConfigService],
  exports: [BatchService, PipelineService],
})
export class BatchModule {}
