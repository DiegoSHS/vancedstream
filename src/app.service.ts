import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
import WebTorrent, { Torrent } from 'webtorrent';

interface TorrentUsage {
  lastUsed: number;
}

@Injectable()
export class AppService {
  private usageMap: Map<string, TorrentUsage> = new Map()
  private readonly cleanupInterval = setInterval(() => this.cleanupOldTorrents(), 2 * 60 * 1000);
  private readonly client = new WebTorrent()
  private readonly expiration: number = 5 * 60 * 1000

  constructor(
    private readonly logger: Logger = new Logger(AppService.name)
  ) {
    this.client.on('error', (err: Error) => {
      this.logger.error('WebTorrent client error:', err);
    });
  }

  /**
   * Obtiene un torrent existente por magnet, o null si no existe.
   */
  async getTorrent(magnet: string): Promise<Torrent | null> {
    return this.client.get(magnet) || null;
  }

  /**
   * Añade un torrent y espera a que esté listo (el callback de client.add es 'ready').
   */
  addTorrent(magnet: string): Promise<Torrent> {
    return new Promise((resolve, reject) => {
      this.client.add(magnet, {
        strategy: 'sequential',
      }, (torrent) => {
        this.logger.log(`Torrent added and ready: ${torrent.infoHash}`);
        this.markTorrentAsUsed(magnet);
        torrent.on('error', (err: Error) => {
          this.logger.error('Torrent error:', err);
          reject(err);
        });
        resolve(torrent);
      });
    });
  }

  /**
   * Obtiene un torrent existente o lo añade si no existe. Marca el uso para la expiración.
   * Timeout de 60s si no está listo.
   */
  async getOrAddTorrent(magnet: string): Promise<Torrent> {
    this.markTorrentAsUsed(magnet);
    const torrent = await this.getTorrent(magnet);
    if (torrent) return torrent;
    return await Promise.race([
      this.addTorrent(magnet),
      new Promise<Torrent>((_, reject) => setTimeout(() => reject(new Error('Timeout: Torrent not ready')), 60000))
    ]);
  }

  /**
   * Marca el torrent como usado (actualiza el timestamp en usageMap).
   */
  markTorrentAsUsed(magnet: string) {
    this.usageMap.set(magnet, { lastUsed: Date.now() });
  }

  /**
   * Limpia torrents que no han sido usados en el periodo de expiración.
   */
  cleanupOldTorrents() {
    const now = Date.now();
    for (const [magnet, usage] of this.usageMap.entries()) {
      if (now - usage.lastUsed > this.expiration) {
        this.logger.log(`Cleaning up expired torrent: ${magnet}`);
        this.removeTorrent(magnet);
      }
    }
  }

  /**
   * Elimina un torrent del cliente y del usageMap.
   */
  removeTorrent(magnet: string): void {
    const torrent = this.client.get(magnet);
    if (torrent) {
      this.client.remove(magnet, {}, (err) => {
        if (err) this.logger.error('Error removing torrent', err);
        else this.logger.log('Torrent removed successfully');
      });
    }
    this.usageMap.delete(magnet);
  }
}
