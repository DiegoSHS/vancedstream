/**
 * Streaming configuration and constants
 * Responsibility: Configuration management
 */

export const WEBTORRENT = 'WebTorrent'

export const STREAM_CONFIG = {
    // Progressive streaming buffer thresholds
    progressiveBufferThresholds: {
        initial: 20 * 1024 * 1024,     // 20 MB - límite máximo de buffer inicial (vídeos largos)
    },

    // Dynamic chunk sizes based on video quality
    chunkSizes: {
        low: 1024 * 1024 * 1,      // 1 MB  - Mobile/Low quality
        medium: 1024 * 1024 * 2,   // 2 MB  - Standard quality (default)
        high: 1024 * 1024 * 4,     // 4 MB  - HD (720p/1080p)
        ultra: 1024 * 1024 * 8,    // 8 MB  - 4K/UHD y vídeos muy pesados
    },

    // MIME types for supported video formats
    mimeTypes: {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
    },

    // Regular expressions
    patterns: {
        videoFileRegex: /\.(mp4|mkv|webm|avi)$/i,
        rangeRegex: /bytes=(\d+)-?(\d+)?/,
    },

    // Timeout values
    timeouts: {
        progressiveBuffer: 30000, // 30 seconds
    },

    // Check intervals
    intervals: {
        bufferCheck: 100, // 100ms
    },
} as const;
