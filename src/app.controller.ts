import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
// @ts-ignore
import { AppService } from './app.service.js';
import { StreamService } from './stream.service.js';
import { Torrent } from 'webtorrent';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly streamService: StreamService,
  ) { }

  @Get()
  async stream(
    @Query('magnet') magnet: string,
    @Query('range') range?: string,
  ) {
    if (!magnet) {
      return { message: 'Magnet link is required' };
    }

    const torrent: Torrent = await this.appService.getOrAddTorrent(magnet);
    const { data: file, error: fileError } = this.streamService.getVideoFile(torrent);
    if (fileError || !file) {
      return { message: fileError || 'No video file found in the torrent' };
    }

    const fileSize = file.length;
    const { data: { start, end } } = this.streamService.getChunkRange(range, fileSize);
    console.log(`[STREAM] Range request: ${range} => start: ${start}, end: ${end}, chunk: ${end - start + 1} bytes`);
    // Prioriza la descarga del rango solicitado
    if (typeof file.deselect === 'function' && typeof file.select === 'function') {
      file.deselect();
      file.select();
    }
    const { data: ext } = this.streamService.getFileExtension(file);
    const { data: mimeType } = this.streamService.getMimeType(ext);
    const { data: stream } = this.streamService.createFileStream(file, start, end);
    return new StreamableFile(stream as Readable, {
      type: mimeType,
      disposition: `inline; filename="${file.name}"`,
      length: fileSize,
    });
  }
}
