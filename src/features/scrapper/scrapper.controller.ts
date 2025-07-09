import { Controller, Get, Query } from '@nestjs/common';
import { PuppeteerService } from './puppeteer/puppeteer.service';

@Controller('scrapper')
export class ScrapperController {
    constructor(private readonly puppeteerService: PuppeteerService) { }

    @Get('page-content')
    async getPageContent(@Query('movieName') movieName: string) {
        if (!movieName) {
            return { error: 'Se requiere un nombre' };
        }
        const content = await this.puppeteerService.getFirstMagnetLink(movieName);
        return { content };
    }
}
