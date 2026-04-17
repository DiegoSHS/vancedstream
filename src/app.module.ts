import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { StreamModule } from './stream/stream.module.js';
import { TorrentModule } from './torrent/torrent.module.js';
import { LoggerService } from './common/logger/logger.service.js';
import { ThePBModule } from './thepb/thepb.module.js';

@Module({
  imports: [ConfigModule.forRoot(), StreamModule, TorrentModule, ThePBModule],
  controllers: [AppController],
  providers: [Logger, LoggerService],
})
export class AppModule { }
