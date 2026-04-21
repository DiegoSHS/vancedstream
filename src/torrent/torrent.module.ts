import { Module } from '@nestjs/common';
import { TorrentService } from './torrent.service.js';
import { TrackerCacheService } from './tracker-cache.service.js';
import { LoggerService } from '../common/logger/logger.service.js';

@Module({
  providers: [TorrentService, TrackerCacheService, LoggerService],
  exports: [TorrentService, TrackerCacheService],
})
export class TorrentModule { }
