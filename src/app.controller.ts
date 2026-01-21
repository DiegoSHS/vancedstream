import { Controller, Get, Headers, Query, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import { TorrentService } from './torrent/torrent.service.js';
import { StreamService } from './stream/stream.service.js';
import { Torrent } from 'webtorrent';
import { LoggerService } from './common/logger/logger.service';

/**
 * AppController
 * Responsibility: Handle HTTP requests for video streaming
 */
@Controller()
export class AppController {
  constructor(
    private readonly torrentService: TorrentService,
    private readonly streamService: StreamService,
    private readonly logger: LoggerService,
  ) { }

  /**
   * GET / - Stream video from torrent
   * Query params:
   *   - magnet: Magnet link (required)
   *   - progressive: Enable progressive buffering (default: true)
   * Headers:
   *   - Range: Byte range for partial content
   */
  @Get()
  async stream(
    @Query('magnet') magnet: string,
    @Query('progressive') progressive: string = 'true',
    @Headers() headers,
  ) {
    if (!magnet) {
      return { message: 'Magnet link is required' };
    }

    try {
      const enableProgressive = progressive !== 'false';
      const startTime = Date.now();

      // Step 1: Get or add torrent with progressive mode
      this.logger.info(
        `Starting ${enableProgressive ? 'progressive' : 'standard'} stream for magnet`,
        'AppController',
      );
      const torrent: Torrent = await this.torrentService.getOrAddTorrent(magnet);
      const getOrAddTime = Date.now() - startTime;

      // Step 2: Get stream metadata
      const range = headers.range?.toString();
      let metadata;

      if (enableProgressive) {
        // Progressive: returns immediately when buffer is ready
        const { data: progMetadata, error: progError } = await this.streamService.getStreamWithProgressiveLoading(torrent, range);

        if (progError || !progMetadata) {
          return { message: progError || 'Failed to setup progressive stream' };
        }
        metadata = progMetadata;
        this.logger.info(
          `Progressive buffer ready in ${Date.now() - startTime}ms (get-or-add: ${getOrAddTime}ms)`,
          'AppController',
        );
      } else {
        // Standard: uses old method
        const { data: stdMetadata, error: stdError } = this.streamService.getStreamMetadata(torrent, range);

        if (stdError || !stdMetadata) {
          return { message: stdError || 'Failed to get stream metadata' };
        }
        metadata = stdMetadata;
      }

      // Step 3: Create and return stream immediately
      const { data: stream, error: streamError } = this.streamService.createFileStream(
        metadata.file,
        metadata.start,
        metadata.end
      );

      if (streamError || !stream) {
        return { message: streamError || 'Failed to create file stream' };
      }

      const totalTime = Date.now() - startTime;
      this.logger.info(
        `${enableProgressive ? '✓ PROGRESSIVE' : 'STANDARD'} | ` +
        `Range: ${range || 'initial'} | ` +
        `start: ${metadata.start}, end: ${metadata.end}, ` +
        `chunk: ${metadata.chunkSize} bytes | ` +
        `file: ${metadata.fileName} | ` +
        `Total time: ${totalTime}ms`,
        'AppController',
      );

      return new StreamableFile(stream as Readable, {
        type: metadata.mimeType,
        disposition: `inline; filename="${metadata.fileName}"`,
        length: metadata.fileSize,
      });
    } catch (error: any) {
      this.logger.error('Stream error', error, 'AppController');
      return { message: error?.message || 'Stream error' };
    }
  }
}
