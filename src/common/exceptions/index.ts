import { HttpException, HttpStatus } from '@nestjs/common';

export class StreamError extends HttpException {
    constructor(message: string) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export class InvalidStreamError extends HttpException {
    constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

export class VideoNotFoundError extends HttpException {
    constructor(message: string = 'No valid video file found in torrent') {
        super(message, HttpStatus.NOT_FOUND);
    }
}

export class TorrentError extends HttpException {
    constructor(message: string) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

/**
 * Safe error extraction utility - pure function
 */
export const extractErrorMessage = (error: unknown, context: string = 'Unknown error'): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as any).message);
    }
    return context;
};
