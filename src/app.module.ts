import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { StreamModule } from './stream/stream.module';
import { TorrentModule } from './torrent/torrent.module';
import { LoggerService } from './common/logger/logger.service';

@Module({
  imports: [ConfigModule.forRoot(), StreamModule, TorrentModule],
  controllers: [AppController],
  providers: [Logger, LoggerService],
})
export class AppModule { }
