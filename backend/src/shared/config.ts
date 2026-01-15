// Configuration and setup types
import { Logger } from '@nestjs/common';

export interface ConfigService {
  get(key: string): string | undefined;
  getOrThrow(key: string): string;
}

export const logger = new Logger();
