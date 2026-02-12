/**
 * Central type definitions for the application
 */

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}

export interface StreamMetadata {
    file: any; // TorrentFile type
    fileSize: number;
    start: number;
    end: number;
    fileName: string;
    mimeType: string;
    chunkSize: number;
    isProgressive?: boolean;
}

export interface BufferStatus {
    ready: boolean;
    downloadedBytes: number;
    elapsedMs: number;
}

export interface ByteRangeStatus {
    available: boolean;
    elapsedMs: number;
}

export interface RangeRequest {
    start: number;
    end?: number;
}

export interface FileMetadataInfo {
    fileName: string;
    fileSize: number;
    ext: string;
    mimeType: string;
}

export type ErrorHandler = (error: unknown, context?: string) => string;
