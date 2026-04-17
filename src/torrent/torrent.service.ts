import { Injectable } from '@nestjs/common';
import { unlinkSync } from 'fs';
import { LoggerService } from '../common/logger/logger.service.js';
import WebTorrent, { Torrent } from 'webtorrent';

interface TorrentUsageEntry {
  lastUsedAt: number;
}

// Limpieza cada minuto, pero expiración pensada para sesiones largas (~1h)
const TORRENT_CLEANUP_INTERVAL_MS = 60 * 1000;      // 1 minuto
const TORRENT_EXPIRATION_MS = 60 * 60 * 1000;       // 60 minutos
const TORRENT_READY_TIMEOUT_MS = 60 * 1000;         // 60 segundos para que el torrent esté listo

/**
 * TorrentService
 * Responsibility: Manage torrent lifecycle (add, get, remove, cleanup)
 */
@Injectable()
export class TorrentService {
  private readonly usageMap: Map<string, TorrentUsageEntry> = new Map();
  private readonly cleanupInterval = setInterval(
    () => this.cleanupOldTorrents(),
    TORRENT_CLEANUP_INTERVAL_MS,
  );
  private readonly client = new WebTorrent({ maxConns: 40 });

  constructor(private readonly logger: LoggerService) {
    this.client.on('error', (err) => {
      this.logger.error('WebTorrent client error', err, 'TorrentService');
    });
  }
  extractInfo(magnetLink) {
    const urlParams = new URLSearchParams(magnetLink.split('?')[1]);

    // Extraer hash
    const xt = urlParams.get('xt');
    const hash = xt?.replace('urn:btih:', '') || '';

    // Extraer nombre
    const name = urlParams.get('dn') || undefined;

    // Extraer trackers
    const trackers = urlParams.getAll('tr');
    return {
      trackers,
      name,
      hash
    }
  }
  /**
 * Get existing torrent by magnet link, or null if not exists
 */
  async getTorrent(magnet: string): Promise<Torrent | null> {
    try {
      const torrent = this.client.get(magnet) as unknown as Torrent | null;
      if (!torrent) return null;
      return torrent as Torrent;
    } catch {
      return null;
    }
  }

  /**
   * Add a torrent and wait for it to be ready
   * Configures sequential strategy and multiple trackers
  */
  addTorrent(magnet: string): Promise<Torrent> {
    const { trackers } = this.extractInfo(magnet)
    console.log(trackers.length)
    return new Promise((resolve, reject) => {
      this.client.add(magnet, {
        strategy: 'sequential',
        announce: [
          'udp://tracker.opentrackr.org:1337',
          'udp://opentor.org:2710',
          'udp://open.stealth.si:80',
          ...trackers
        ]
      }, (torrent) => {
        this.logger.info(`Torrent added and ready: ${torrent.infoHash}`);
        this.markTorrentAsUsed(magnet);
        resolve(torrent);
      });
    });
  }

  /**
   * Get existing torrent or add if not exists
   * Returns torrent with 60s timeout
   */
  async getOrAddTorrent(magnet: string): Promise<Torrent> {
    this.markTorrentAsUsed(magnet);
    const torrent = await this.getTorrent(magnet);
    if (torrent) return torrent;
    return await Promise.race([
      this.addTorrent(magnet),
      new Promise<Torrent>((_, reject) =>
        setTimeout(
          () => reject(new Error('Timeout: Torrent not ready')),
          TORRENT_READY_TIMEOUT_MS,
        ),
      ),
    ]);
  }

  /**
   * Mark torrent as used (update timestamp in usageMap)
   */
  markTorrentAsUsed(magnet: string) {
    this.usageMap.set(magnet, { lastUsedAt: Date.now() });
  }

  /**
   * Cleanup torrents not used within expiration period
   */
  cleanupOldTorrents() {
    const now = Date.now();
    for (const [magnet, usage] of this.usageMap.entries()) {
      if (now - usage.lastUsedAt > TORRENT_EXPIRATION_MS) {
        this.logger.info(`Cleaning up expired torrent: ${magnet}`, 'TorrentService');
        this.removeTorrent(magnet);
      }
    }
  }

  /**
   * Remove torrent from client and usageMap, delete temporary files
   */
  async removeTorrent(magnet: string): Promise<void> {
    let torrent: Torrent | null;
    try {
      torrent = this.client.get(magnet) as unknown as Torrent | null;
    } catch {
      torrent = null;
    }
    if (torrent) {
      const files = torrent.files?.map(f => f.path) || [];
      this.client.remove(magnet, {}, (err) => {
        if (err) {
          this.logger.error('Error removing torrent', err, 'TorrentService');
        } else {
          this.logger.info('Torrent removed successfully', 'TorrentService');
        }
        for (const filePath of files) {
          try {
            unlinkSync(filePath);
          } catch (e) {
            this.logger.warn(`Failed to delete file ${filePath}`, 'TorrentService');
          }
        }
      });
    }
    this.usageMap.delete(magnet);
  }
}
