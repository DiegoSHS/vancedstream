import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { StreamModule } from './stream/stream.module';
import { TorrentModule } from './torrent/torrent.module';

@Module({
  imports: [ConfigModule.forRoot(), StreamModule, TorrentModule],
  controllers: [AppController],
  providers: [Logger],
})
export class AppModule { }
