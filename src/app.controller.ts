import { Controller, Get, Headers, Query, StreamableFile, Res, Post, Body, BadRequestException, ValidationPipe } from '@nestjs/common';
import { Readable } from 'stream';
import { TorrentService } from './torrent/torrent.service.js';
import { StreamService } from './stream/stream.service.js';
import { Torrent } from 'webtorrent';
import { LoggerService } from './common/logger/logger.service.js';
import type { FastifyReply } from 'fastify';
import { ThePBService } from './thepb/thepb.service.js';
import { TrackerCacheService } from './torrent/tracker-cache.service.js';
import { SaveHashDto } from './torrent/dto/save-hash.dto.js';

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
    private readonly TPBService: ThePBService,
    private readonly trackerCache: TrackerCacheService
  ) { }

  /**
   * GET / - Stream video from torrent
   * Query params:
   *   - magnet: Magnet link (required)
   * Headers:
   *   - Range: Byte range for partial content
   */
  @Get()
  async stream(
    @Query('magnet') magnet: string,
    @Headers('range') range: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    if (!magnet) {
      return { message: 'Magnet link is required' };
    }

    try {
      const startTime = Date.now();

      // Step 1: Get or add torrent
      this.logger.info('Starting optimized stream for magnet', 'AppController');
      const torrent: Torrent = await this.torrentService.getOrAddTorrent(magnet);
      const getOrAddTime = Date.now() - startTime;

      // Step 2: Get stream metadata
      const { data: metadata, error: metadataError } = await this.streamService.getStreamMetadata(torrent, range);

      if (metadataError || !metadata) {
        return { message: metadataError || 'Failed to setup stream' };
      }

      this.logger.info(
        `Initial buffer ready in ${Date.now() - startTime}ms (get-or-add: ${getOrAddTime}ms)`,
        'AppController',
      );

      // Step 3: Create and return stream immediately
      const { data: stream, error: streamError } = this.streamService.createFileStream(
        metadata.file,
        metadata.start,
        metadata.end
      );

      if (streamError || !stream) {
        return { message: streamError || 'Failed to create file stream' };
      }

      // Configure HTTP status and range headers for efficient streaming
      const chunkSize = metadata.chunkSize;

      res.status(206);
      res.headers({
        "accept-ranges": "bytes",
        "content-range": `bytes ${metadata.start}-${metadata.end}/${metadata.fileSize}`,
        "content-length": chunkSize.toString()
      })
      const totalTime = Date.now() - startTime;
      this.logger.info(
        `✓ STREAM | ` +
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
        length: chunkSize,
      });
    } catch (error: any) {
      this.logger.error('Stream error', error, 'AppController');
      return { message: error?.message || 'Stream error' };
    }
  }

  @Get('/tpb_search')
  async movies(
    @Query('title') title: string
  ) {
    return this.TPBService.getTPBMovies(title)
  }
  @Post('/save_hash')
  async saveMovieHash(
    @Body() body: SaveHashDto
  ) {
    if (!body.name || !body.hash) {
      this.logger.warn('Missing id or hash in request body', 'AppController');
      throw new BadRequestException('Both id and hash are required')
    }
    return this.trackerCache.setTorrentHash(body.name, body.hash)
  }
  @Get('/get_hashes')
  getMovieHashes() {
    return this.trackerCache.getTorrentHashes()
  }
}
