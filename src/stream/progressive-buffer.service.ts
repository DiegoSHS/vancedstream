import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { STREAM_CONFIG } from 'src/constants';
import { TorrentFile } from 'webtorrent';

/**
 * Responsibility: Progressive buffering and download monitoring
 */
@Injectable()
export class ProgressiveBufferService {
    constructor(private readonly logger: LoggerService) { }
    /**
     * Wait for initial buffer to be available for streaming
     * Monitors file.downloaded property until threshold is reached or timeout
     */
    async waitForInitialBuffer(
        file: TorrentFile,
        requestedStart: number
    ): Promise<{ ready: boolean; downloadedBytes: number; elapsedMs: number }> {
        const bufferRequired = STREAM_CONFIG.progressiveBufferThresholds.initial;
        const endByte = Math.min(requestedStart + bufferRequired, file.length - 1);
        const startTime = Date.now();
        const timeoutMs = STREAM_CONFIG.timeouts.progressiveBuffer;
        const checkInterval = STREAM_CONFIG.intervals.bufferCheck;

        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const downloaded = file.downloaded;

                // Buffer ready
                if (downloaded >= endByte) {
                    clearInterval(intervalId);
                    this.logger.info(
                        `[PROGRESSIVE] Buffer ready in ${elapsed}ms. ` +
                        `Downloaded: ${(downloaded / (1024 * 1024)).toFixed(2)} MB`,
                        'ProgressiveBufferService',
                    );
                    resolve({ ready: true, downloadedBytes: downloaded, elapsedMs: elapsed });
                    return;
                }

                // Timeout reached
                if (elapsed > timeoutMs) {
                    clearInterval(intervalId);
                    this.logger.warn(
                        `[PROGRESSIVE] Timeout after ${elapsed}ms. ` +
                        `Downloaded: ${(downloaded / (1024 * 1024)).toFixed(2)} MB / ` +
                        `Required: ${(bufferRequired / (1024 * 1024)).toFixed(2)} MB`,
                        'ProgressiveBufferService',
                    );
                    resolve({ ready: false, downloadedBytes: downloaded, elapsedMs: elapsed });
                    return;
                }
            }, checkInterval);
        });
    }

    /**
     * Wait for specific byte range to be available
     */
    async waitForByteRange(
        file: TorrentFile,
        endByte: number
    ): Promise<{ available: boolean; elapsedMs: number }> {
        const startTime = Date.now();
        const timeoutMs = STREAM_CONFIG.timeouts.progressiveBuffer;
        const checkInterval = STREAM_CONFIG.intervals.bufferCheck;

        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                const elapsed = Date.now() - startTime;

                if (file.downloaded >= endByte + 1) {
                    clearInterval(intervalId);
                    this.logger.info(
                        `[PROGRESSIVE] Byte range ready (${endByte} bytes) in ${elapsed}ms`,
                        'ProgressiveBufferService',
                    );
                    resolve({ available: true, elapsedMs: elapsed });
                    return;
                }

                if (elapsed > timeoutMs) {
                    clearInterval(intervalId);
                    this.logger.warn(
                        `[PROGRESSIVE] Timeout waiting for byte ${endByte}`,
                        'ProgressiveBufferService',
                    );
                    resolve({ available: false, elapsedMs: elapsed });
                }
            }, checkInterval);
        });
    }
}
