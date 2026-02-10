import { Injectable, NotFoundException } from '@nestjs/common';
import { STREAM_CONFIG } from '../constants.js';
import { Torrent, TorrentFile } from 'webtorrent';

/**
 * Responsibility: File metadata extraction and validation
 * Extract and provide file information from torrent
 */
@Injectable()
export class FileMetadataService {
    /**
     * Find and validate video file in torrent
     */
    findVideoFile(torrent: Torrent): TorrentFile {
        const file = torrent.files.find((f: TorrentFile) =>
            STREAM_CONFIG.patterns.videoFileRegex.test(f.name)
        );

        if (!file) throw new NotFoundException('No valid video file found in torrent');
        return file;
    }

    /**
     * Extract file extension from filename
     */
    getFileExtension(fileName: string): string {
        return fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    }

    /**
     * Get MIME type for video format
     */
    getMimeType(ext: string): string {
        return STREAM_CONFIG.mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Get complete file metadata
     */
    getFileMetadata(file: TorrentFile): {
        fileName: string;
        fileSize: number;
        ext: string;
        mimeType: string;
    } {
        const ext = this.getFileExtension(file.name);
        const mimeType = this.getMimeType(ext);

        return {
            fileName: file.name,
            fileSize: file.length,
            ext,
            mimeType,
        };
    }
}
