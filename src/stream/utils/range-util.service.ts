import { Injectable } from '@nestjs/common';

/**
 * Utility functions for working with byte ranges - pure functions
 */
@Injectable()
export class RangeUtilService {
    /**
     * Convert bytes to human-readable format (pure function)
     */
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Determine file quality based on size (pure function)
     */
    static getQualityLevel(fileSize: number): 'low' | 'medium' | 'high' | 'ultra' {
        const MB = 1024 * 1024;
        const GB = MB * 1024;

        if (fileSize < 100 * MB) return 'low';
        if (fileSize < 1 * GB) return 'medium';
        if (fileSize < 5 * GB) return 'high';
        return 'ultra';
    }

    /**
     * Validate byte range is within bounds (pure function)
     */
    static isValidRange(start: number, end: number, fileSize: number): boolean {
        return start >= 0 && end < fileSize && start <= end;
    }

    /**
     * Calculate percentage downloaded (pure function)
     */
    static calculateProgress(downloaded: number, total: number): number {
        return Math.round((downloaded / total) * 100);
    }
}
