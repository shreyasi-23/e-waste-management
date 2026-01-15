import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(private config: NestConfigService) {}

  get isDev(): boolean {
    return this.config.get('NODE_ENV') === 'development';
  }

  get port(): number {
    return this.config.get('PORT') ? parseInt(this.config.get('PORT')!) : 3000;
  }

  get databaseUrl(): string {
    return this.config.getOrThrow('DATABASE_URL');
  }

  get redisHost(): string {
    return this.config.get('REDIS_HOST') || 'localhost';
  }

  get redisPort(): number {
    return this.config.get('REDIS_PORT')
      ? parseInt(this.config.get('REDIS_PORT')!)
      : 6379;
  }

  get s3Endpoint(): string {
    return this.config.getOrThrow('S3_ENDPOINT');
  }

  get s3AccessKey(): string {
    return this.config.getOrThrow('S3_ACCESS_KEY');
  }

  get s3SecretKey(): string {
    return this.config.getOrThrow('S3_SECRET_KEY');
  }

  get s3Bucket(): string {
    return this.config.get('S3_BUCKET') || 'ewaste-images';
  }

  get s3Region(): string {
    return this.config.get('S3_REGION') || 'us-east-1';
  }

  get geminiApiKey(): string {
    return this.config.getOrThrow('GEMINI_API_KEY');
  }

  get geminiModel(): string {
    return this.config.get('GEMINI_MODEL') || 'gemini-2.0-flash';
  }

  get detectorType(): 'stub' | 'yolo' | 'api' {
    return (this.config.get('DETECTOR_TYPE') || 'stub') as any;
  }

  get detectorEndpoint(): string {
    return this.config.get('DETECTOR_ENDPOINT') || 'http://localhost:8000';
  }

  get logLevel(): string {
    return this.config.get('LOG_LEVEL') || 'info';
  }

  get defaultCurrency(): string {
    return this.config.get('DEFAULT_CURRENCY') || 'USD';
  }

  get storageType(): 'minio' | 's3' {
    return (this.config.get('STORAGE_TYPE') || 'minio') as any;
  }
}
