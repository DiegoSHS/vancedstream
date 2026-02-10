import { Module } from '@nestjs/common';
import { TorrentService } from './torrent.service.js';
import { LoggerService } from '../common/logger/logger.service.js';

@Module({
  providers: [TorrentService, LoggerService],
  exports: [TorrentService],
})
export class TorrentModule { }
