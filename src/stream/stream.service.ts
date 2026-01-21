import { Injectable } from '@nestjs/common';
import { Torrent, TorrentFile } from 'webtorrent';
import type { StreamMetadata } from '../common/types';
import { FileMetadataService } from './file-metadata.service';
import { RangeParserService } from './range-parser.service';
import { ProgressiveBufferService } from './progressive-buffer.service';
import { StreamCreatorService } from './stream-creator.service';

/**
 * StreamService
 * Responsibility: Orchestrate stream generation (metadata + buffer + file stream)
 */
@Injectable()
export class StreamService {
  constructor(
    private fileMetadata: FileMetadataService,
    private rangeParser: RangeParserService,
    private progressiveBuffer: ProgressiveBufferService,
    private streamCreator: StreamCreatorService,
  ) { }

  /**
   * Get complete stream metadata for standard (non-progressive) streaming
   */
  getStreamMetadata(
    torrent: Torrent,
    rangeHeader: string | undefined,
  ): { error: string | null; data: StreamMetadata | null } {
    try {
      const file = this.fileMetadata.findVideoFile(torrent);
      const { ext, fileName, fileSize, mimeType } = this.fileMetadata.getFileMetadata(file);
      const { start, end } = this.rangeParser.getChunkBoundaries(
        rangeHeader,
        fileSize
      );

      const metadata: StreamMetadata = {
        file,
        fileSize,
        start,
        end,
        fileName,
        mimeType,
        chunkSize: end - start + 1,
      };

      return {
        error: null,
        data: metadata,
      };
    } catch (error: any) {
      return {
        data: null,
        error: error?.message || 'Error obtaining stream metadata',
      };
    }
  }

  /**
   * Get stream metadata with progressive buffer support
   * Waits for initial buffer before returning
   */
  async getStreamWithProgressiveLoading(
    torrent: Torrent,
    rangeHeader: string | undefined,
  ): Promise<{ error: string | null; data: StreamMetadata | null }> {
    try {
      const file = this.fileMetadata.findVideoFile(torrent);
      const { ext, fileName, fileSize, mimeType } = this.fileMetadata.getFileMetadata(file);
      const { start, end } = this.rangeParser.getChunkBoundaries(
        rangeHeader,
        fileSize
      );

      // Wait for progressive buffer
      const bufferResult = await this.progressiveBuffer.waitForInitialBuffer(
        file,
        start
      );

      if (!bufferResult.ready) {
        console.warn(
          `[PROGRESSIVE] Insufficient buffer, continuing anyway ` +
          `(${(bufferResult.downloadedBytes / (1024 * 1024)).toFixed(2)} MB)`
        );
      }

      const metadata: StreamMetadata = {
        file,
        fileSize,
        start,
        end,
        fileName,
        mimeType,
        chunkSize: end - start + 1,
        isProgressive: true,
      };

      return {
        error: null,
        data: metadata,
      };
    } catch (error: any) {
      return {
        data: null,
        error: error?.message || 'Error in progressive stream setup',
      };
    }
  }

  /**
   * Create readable stream for a file range
   */
  createFileStream(
    file: TorrentFile,
    start: number,
    end: number
  ): { error: string | null; data: NodeJS.ReadableStream | null } {
    try {
      const stream = this.streamCreator.createStream(file, start, end);
      return { data: stream, error: null };
    } catch (error: any) {
      return { data: null, error: error?.message || 'Error creating file stream' };
    }
  }
}
