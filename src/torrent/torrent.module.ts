import { Module } from '@nestjs/common';
import { TorrentService } from './torrent.service';
import { LoggerService } from 'src/common/logger/logger.service';

@Module({
  providers: [TorrentService, LoggerService],
  exports: [TorrentService],
})
export class TorrentModule { }
