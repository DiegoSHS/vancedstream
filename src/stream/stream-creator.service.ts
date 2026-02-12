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
}
