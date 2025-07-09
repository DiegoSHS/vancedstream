import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PuppeteerService {
    async getPageContent(url: string): Promise<string> {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        const content = await page.content();
        await browser.close();
        return content;
    }

    async getFirstMagnetLink(movieName: string): Promise<string | null> {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        const searchUrl = `${process.env.MOVIE_WEBSITE_URL}/search/${encodeURIComponent(movieName)}/1/`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        // Esperar a que la tabla de resultados esté presente
        await page.waitForSelector('.table-list tbody tr a');
        // Hacer click en el primer resultado
        const firstResultSelector = '.table-list tbody tr a';
        await page.click(firstResultSelector);
        // Esperar a que cargue la página del torrent
        await page.waitForSelector('a[href^="magnet:"]');
        // Obtener el enlace del botón MAGNET DOWNLOAD
        const magnetLink = await page.evaluate(() => {
            const magnetAnchor = Array.from(document.querySelectorAll('a')).find(a => a.textContent?.includes('MAGNET DOWNLOAD'));
            return magnetAnchor ? magnetAnchor.getAttribute('href') : null;
        });
        await browser.close();
        return magnetLink || null;
    }
}
