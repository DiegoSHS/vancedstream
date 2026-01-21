import { Injectable } from '@nestjs/common';
import { TorrentFile } from 'webtorrent';

/**
 * Responsibility: File stream creation and management
 */
@Injectable()
export class StreamCreatorService {
    /**
     * Create readable stream from torrent file with byte range
     */
    createStream(
        file: TorrentFile,
        start: number,
        end: number
    ): NodeJS.ReadableStream {
        return file.createReadStream({ start, end });
    }

    /**
     * Validate that requested range is within file bounds
     */
    validateRange(start: number, end: number, fileSize: number): boolean {
        return start >= 0 && end < fileSize && start <= end;
    }
}
