import { Module } from '@nestjs/common';
import { TorrentModule } from '../torrent/torrent.module.js';
import { LoggerService } from '../common/logger/logger.service.js';
import { StreamService } from './stream.service.js';
import { StreamCreatorService } from './stream-creator.service.js';
import { FileMetadataService } from './file-metadata.service.js';
import { ProgressiveBufferService } from './progressive-buffer.service.js';
import { RangeParserService } from './range-parser.service.js';

@Module({
  imports: [TorrentModule],
  providers: [
    LoggerService,
    StreamService,
    RangeParserService,
    ProgressiveBufferService,
    FileMetadataService,
    StreamCreatorService,
  ],
  exports: [
    LoggerService,
    StreamService,
    RangeParserService,
    ProgressiveBufferService,
    FileMetadataService,
    StreamCreatorService,
  ],
})
export class StreamModule { }
