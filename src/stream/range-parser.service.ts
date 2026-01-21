import { Injectable } from '@nestjs/common';
import { STREAM_CONFIG } from 'src/constants';

/**
 * Responsibility: HTTP Range header parsing and chunk calculation
 */
@Injectable()
export class RangeParserService {
    /**
     * Parse byte range from HTTP Range header
     * Format: bytes=start-end or bytes=start-
     */
    parseRange(rangeHeader: string): { start: number; end?: number } | null {
        const match = STREAM_CONFIG.patterns.rangeRegex.exec(rangeHeader);

        if (!match) {
            return null;
        }

        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : undefined;

        return { start, end };
    }

    /**
     * Calculate optimal chunk size based on file size
     * Small files (<100MB): 512KB
     * Medium files (100MB-1GB): 1MB
     * Large files (1GB-5GB): 2MB
     * Very large files (>5GB): 4MB
     */
    getOptimalChunkSize(fileSize: number): number {
        const MB = 1024 * 1024;
        const GB = MB * 1024;

        if (fileSize < 100 * MB) return STREAM_CONFIG.chunkSizes.low;
        if (fileSize < 1 * GB) return STREAM_CONFIG.chunkSizes.medium;
        if (fileSize < 5 * GB) return STREAM_CONFIG.chunkSizes.high;
        return STREAM_CONFIG.chunkSizes.ultra;
    }

    /**
     * Calculate chunk boundaries for initial request (no Range header)
     */
    getInitialChunkBoundaries(fileSize: number): { start: number; end: number } {
        const chunkSize = this.getOptimalChunkSize(fileSize);
        const end = Math.min(chunkSize - 1, fileSize - 1);

        return { start: 0, end };
    }

    /**
     * Calculate chunk boundaries for range request
     */
    getRangeChunkBoundaries(
        rangeStart: number,
        fileSize: number,
        rangeEnd?: number
    ): { start: number; end: number } {
        if (rangeEnd !== undefined) {
            return { start: rangeStart, end: Math.min(rangeEnd, fileSize - 1) };
        }

        const chunkSize = this.getOptimalChunkSize(fileSize);
        const end = Math.min(rangeStart + chunkSize - 1, fileSize - 1);

        return { start: rangeStart, end };
    }

    /**
     * Get chunk boundaries handling both initial and range requests
     */
    getChunkBoundaries(
        rangeHeader: string | undefined,
        fileSize: number
    ): { start: number; end: number } {
        if (!rangeHeader) {
            return this.getInitialChunkBoundaries(fileSize);
        }

        const range = this.parseRange(rangeHeader);
        if (!range) {
            return this.getInitialChunkBoundaries(fileSize);
        }

        return this.getRangeChunkBoundaries(range.start, fileSize, range.end);
    }
}
