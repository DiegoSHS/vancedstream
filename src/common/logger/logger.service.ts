import { Injectable, Logger } from '@nestjs/common';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

/**
 * Centralized logging service
 * Replaces console.log with proper logging
 */
@Injectable()
export class LoggerService {
    private logger = new Logger('VancedStream');

    debug(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            this.logger.debug(`[${context || 'DEBUG'}] ${message}`);
        }
    }

    info(message: string, context?: string): void {
        this.logger.log(`[${context || 'INFO'}] ${message}`);
    }

    warn(message: string, context?: string): void {
        this.logger.warn(`[${context || 'WARN'}] ${message}`);
    }

    error(message: string, error?: any, context?: string): void {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`[${context || 'ERROR'}] ${message}${errorMsg ? ` - ${errorMsg}` : ''}`);
    }

    /**
     * Log with performance metrics
     */
    perf(label: string, duration: number, context?: string): void {
        this.info(`${label}: ${duration}ms`, context || 'PERF');
    }
}
