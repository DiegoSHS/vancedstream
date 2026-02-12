import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service.js';
import { STREAM_CONFIG } from '../constants.js';
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
        const baseRequired = STREAM_CONFIG.progressiveBufferThresholds.initial;
        const MB = 1024 * 1024;
        // Buffer adaptativo: mínimo 5MB, máximo `baseRequired`, y aprox. 2% del archivo
        const adaptiveRequired = Math.min(
            baseRequired,
            Math.max(5 * MB, Math.floor(file.length * 0.02)),
        );

        const bufferRequired = adaptiveRequired;
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
}
