import { Injectable, Logger } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { Client as MinIOClient } from 'minio';
import { AppConfigService } from './app.config';

export interface StorageService {
  uploadBuffer(key: string, buffer: any, mimetype: string): Promise<string>;
  downloadBuffer(key: string): Promise<any>;
  deleteObject(key: string): Promise<void>;
}

@Injectable()
export class S3StorageService implements StorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private client: AWS.S3;

  constructor(private config: AppConfigService) {
    this.client = new AWS.S3({
      endpoint: this.config.s3Endpoint,
      accessKeyId: this.config.s3AccessKey,
      secretAccessKey: this.config.s3SecretKey,
      s3ForcePathStyle: true,
      region: this.config.s3Region,
    });
  }

  async uploadBuffer(
    key: string,
    buffer: any,
    mimetype: string
  ): Promise<string> {
    const params = {
      Bucket: this.config.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    };

    try {
      await this.client.putObject(params).promise();
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${key}`, error);
      throw error;
    }
  }

  async downloadBuffer(key: string): Promise<any> {
    const params = {
      Bucket: this.config.s3Bucket,
      Key: key,
    };

    try {
      const data = await this.client.getObject(params).promise();
      return data.Body;
    } catch (error) {
      this.logger.error(`Failed to download from S3: ${key}`, error);
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const params = {
      Bucket: this.config.s3Bucket,
      Key: key,
    };

    try {
      await this.client.deleteObject(params).promise();
    } catch (error) {
      this.logger.error(`Failed to delete from S3: ${key}`, error);
      throw error;
    }
  }
}

@Injectable()
export class MinIOStorageService implements StorageService {
  private readonly logger = new Logger(MinIOStorageService.name);
  private client: MinIOClient;

  constructor(private config: AppConfigService) {
    const url = new URL(this.config.s3Endpoint);
    this.client = new MinIOClient({
      endPoint: url.hostname,
      port: url.port ? parseInt(url.port) : 9000,
      useSSL: url.protocol === 'https:',
      accessKey: this.config.s3AccessKey,
      secretKey: this.config.s3SecretKey,
    });
  }

  async uploadBuffer(
    key: string,
    buffer: any,
    mimetype: string
  ): Promise<string> {
    try {
      await this.client.putObject(
        this.config.s3Bucket,
        key,
        buffer,
        buffer.length,
        { 'Content-Type': mimetype }
      );
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload to MinIO: ${key}`, error);
      throw error;
    }
  }

  async downloadBuffer(key: string): Promise<any> {
    try {
      const stream = await this.client.getObject(this.config.s3Bucket, key);
      const chunks: any[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to download from MinIO: ${key}`, error);
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.config.s3Bucket, key);
    } catch (error) {
      this.logger.error(`Failed to delete from MinIO: ${key}`, error);
      throw error;
    }
  }
}

@Injectable()
export class StorageFactory {
  constructor(private config: AppConfigService) {}

  create(): StorageService {
    if (this.config.storageType === 's3') {
      return new S3StorageService(this.config);
    }
    return new MinIOStorageService(this.config);
  }
}
