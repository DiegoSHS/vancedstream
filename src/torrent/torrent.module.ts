import { Logger, Module } from '@nestjs/common';
import { TorrentService } from './torrent.service';

@Module({
  providers: [TorrentService, Logger],
  exports: [TorrentService],
})
export class TorrentModule { }
