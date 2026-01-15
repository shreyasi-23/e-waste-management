import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigService } from '@/config/app.config';
import { GeminiService } from '@/config/gemini.config';
import { BatchModule } from '@/modules/batch/batch.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    BatchModule,
  ],
  providers: [AppConfigService, GeminiService],
  exports: [AppConfigService, GeminiService],
})
export class AppModule {}
