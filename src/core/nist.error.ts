import { Logger } from '@nestjs/common';

export interface NistErrorContext {
  name?: string;
}

export class NistError extends Error {
  private static readonly logger = new Logger('NIST');

  constructor(message: string, context: NistErrorContext = {}) {
    super(message);
    this.name = context.name ?? 'NistError';
    NistError.logger.error(`❌ ${this.name}: ${message}`);
  }
}
