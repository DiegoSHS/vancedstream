import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TorrentService {
    private client: any;
    private logger = new Logger(TorrentService.name);

    constructor() {
        this.client = null;
    }

    async getOrAddTorrent(magnet: string): Promise<any> {
        if (!this.client) {
            const WebTorrent = (await import('webtorrent')).default;
            this.client = new WebTorrent();
        }
        return new Promise((resolve, reject) => {
            let torrent = this.client.get(magnet);
            if (torrent) return resolve(torrent);
            torrent = this.client.add(magnet, (t: any) => resolve(t));
            torrent.on('error', reject);
        });
    }
}
