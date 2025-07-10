import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
import { Torrent, TorrentFile } from 'webtorrent';

interface ServiceResult<T> {
    data: T | null;
    error: string | null;
}

@Injectable()
export class StreamService {
    private readonly chunkSize = 1024 * 1024 * 5;
    private readonly mimeTypes: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
    };

    getChunkRange(range: string | undefined, fileSize: number): ServiceResult<{ start: number, end: number }> {
        try {
            let start = 0;
            let end = fileSize - 1;
            if (range) {
                const match = /bytes=(\d+)-?(\d+)?/.exec(range);
                if (match) {
                    start = parseInt(match[1], 10);
                    if (match[2]) {
                        end = Math.min(parseInt(match[2], 10), fileSize - 1);
                    } else {
                        end = Math.min(start + this.chunkSize - 1, fileSize - 1);
                    }
                }
            } else {
                end = Math.min(this.chunkSize - 1, fileSize - 1);
            }
            return { data: { start, end }, error: null };
        } catch (e: any) {
            return { data: null, error: e?.message || 'Error calculando el rango de chunk' };
        }
    }

    isChunkAvailable(file: TorrentFile, end: number): ServiceResult<boolean> {
        try {
            const available = file.downloaded >= end + 1;
            return { data: available, error: null };
        } catch (e: any) {
            return { data: null, error: e?.message || 'Error verificando disponibilidad de chunk' };
        }
    }

    createFileStream(file: TorrentFile, start: number, end: number): ServiceResult<NodeJS.ReadableStream> {
        try {
            if (
                file.downloaded === file.length &&
                typeof file.path === 'string' &&
                file.path.length > 0
            ) {
                const data = createReadStream(file.path, { start, end });
                return { data, error: null };
            }
            const data = file.createReadStream({ start, end });
            return { data, error: null };
        } catch (e: any) {
            return { data: null, error: e?.message || 'Error creando el stream del archivo' };
        }
    }

    getVideoFile(torrent: Torrent): ServiceResult<TorrentFile | undefined> {
        try {
            const file = torrent.files.find((f: TorrentFile) => /\.(mp4|mkv|webm|avi)$/i.test(f.name));
            return { data: file, error: null };
        } catch (e: any) {
            return { data: null, error: e?.message || 'Error obteniendo el archivo de video' };
        }
    }

    getFileExtension(file: TorrentFile): ServiceResult<string> {
        try {
            const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            return { data: ext, error: null };
        } catch (e: any) {
            return { data: null, error: e?.message || 'Error obteniendo la extensión del archivo' };
        }
    }

    getMimeType(ext: string): ServiceResult<string> {
        try {
            const mime = this.mimeTypes[ext] || 'application/octet-stream';
            return { data: mime, error: null };
        } catch (e: any) {
            return { data: null, error: e?.message || 'Error obteniendo el mimeType' };
        }
    }
}