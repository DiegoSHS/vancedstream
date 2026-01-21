import { Module } from '@nestjs/common';
import { TorrentModule } from '../torrent/torrent.module';
import { StreamService } from './stream.service';
import { StreamCreatorService } from './stream-creator.service';
import { FileMetadataService } from './file-metadata.service';
import { ProgressiveBufferService } from './progressive-buffer.service';
import { RangeParserService } from './range-parser.service';

@Module({
  imports: [TorrentModule],
  providers: [
    StreamService,
    RangeParserService,
    ProgressiveBufferService,
    FileMetadataService,
    StreamCreatorService,
  ],
  exports: [
    StreamService,
    RangeParserService,
    ProgressiveBufferService,
    FileMetadataService,
    StreamCreatorService,
  ],
})
export class StreamModule { }
