import { Module } from '@nestjs/common';
import { ScrapperController } from './scrapper.controller';
import { PuppeteerService } from './puppeteer/puppeteer.service';

@Module({
    controllers: [ScrapperController],
    providers: [PuppeteerService],
    exports: [PuppeteerService],
})
export class ScrapperModule { }
