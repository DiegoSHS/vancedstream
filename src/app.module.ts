import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { StreamService } from './stream.service.js';
import { ScrapperModule } from './features/scrapper/scrapper.module';

@Module({
  imports: [ScrapperModule],
  controllers: [AppController],
  providers: [AppService, Logger, StreamService],
})
export class AppModule { }
