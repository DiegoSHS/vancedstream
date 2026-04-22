import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { unlinkSync } from 'fs';
import { LoggerService } from '../common/logger/logger.service.js';
import WebTorrent, { Torrent } from 'webtorrent';
import { TrackerCacheService } from './tracker-cache.service.js';
interface TorrentUsageEntry {
  lastUsedAt: number;
}

// Limpieza cada minuto
const TORRENT_CLEANUP_INTERVAL_MS = 60 * 1000;      // 1 minuto
const TORRENT_EXPIRATION_MS = 10 * 60 * 1000;       // 10 minutos
const TORRENT_READY_TIMEOUT_MS = 60 * 1000;         // 1 minuto para que el torrent esté listo

/**
 * TorrentService
 * Responsibility: Manage torrent lifecycle (add, get, remove, cleanup)
 */
@Injectable()
export class TorrentService extends WebTorrent implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly logger: LoggerService,
    private readonly trackerCache: TrackerCacheService,
  ) {
    super({ maxConns: 40 });
    this.on('error', (err) => {
      this.logger.error('WebTorrent instance error', err, 'TorrentService');
    });
  }
  private readonly cleanupInterval = setInterval(
    () => this.cleanupOldTorrents(),
    TORRENT_CLEANUP_INTERVAL_MS,
  )
  private readonly usageMap: Map<string, TorrentUsageEntry> = new Map()

  onModuleInit() {
    this.logger.info('TorrentService initialized', 'TorrentService');
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
    this.destroy((err) => {
      if (err) {
        this.logger.error('Error destroying TorrentService', err, 'TorrentService');
      } else {
        this.logger.info('TorrentService destroyed successfully', 'TorrentService');
      }
    });
  }
  /**
   * Source - https://stackoverflow.com/a/19707059
   * Posted by Jimbo, modified by community.
   * See post 'Timeline' for change history
   * Retrieved 2026-04-02, License - CC BY-SA 4.0
   */
  magnetRegExp = /magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32}/i

  checkMagnet(magnet: string) {
    return magnet.match(this.magnetRegExp)
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
 * Get existing torrent by hash, or null if not exists
 */
  async getTorrent(hash: string): Promise<Torrent | null> {
    try {
      const torrent = this.get(hash) as unknown as Torrent | null;
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
  async addTorrent(hash: string): Promise<Torrent> {
    const isMagnet = this.checkMagnet(hash)
    if (isMagnet) {
      const { trackers } = this.extractInfo(hash)
      await this.trackerCache.addTrackersFromArray(trackers)
      this.logger.info(`Added ${trackers.length} trackers from magnet link`, 'TorrentService');
    }
    const redisTrackers = await this.trackerCache.getAllTrackers();
    return new Promise((resolve, reject) => {
      this.add(hash, {
        strategy: 'sequential',
        announce: redisTrackers
      }, (torrent) => {
        this.logger.info(`Torrent added and ready: ${torrent.infoHash}`);
        this.markTorrentAsUsed(hash);
        resolve(torrent);
      });
    });
  }
  /**
   * Get existing torrent or add if not exists
   * Returns torrent with 60s timeout
   */
  async getOrAddTorrent(hash: string): Promise<Torrent> {
    this.markTorrentAsUsed(hash);
    const torrent = await this.getTorrent(hash);
    if (torrent) return torrent;
    return await Promise.race([
      this.addTorrent(hash),
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
  markTorrentAsUsed(hash: string) {
    this.usageMap.set(hash, { lastUsedAt: Date.now() });
  }

  /**
   * Cleanup torrents not used within expiration period
   */
  cleanupOldTorrents() {
    const now = Date.now();
    for (const [hash, usage] of this.usageMap.entries()) {
      if (now - usage.lastUsedAt > TORRENT_EXPIRATION_MS) {
        this.logger.info(`Cleaning up expired torrent: ${hash}`, 'TorrentService');
        this.removeTorrent(hash);
      }
    }
  }

  /**
   * Remove torrent from client and usageMap, delete temporary files
   */
  async removeTorrent(hash: string): Promise<void> {
    let torrent: Torrent | null;
    try {
      torrent = this.get(hash) as unknown as Torrent | null;
    } catch {
      torrent = null;
    }
    if (torrent) {
      const files = torrent.files?.map(f => f.path) || [];
      this.remove(hash, {}, (err) => {
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
    this.usageMap.delete(hash);
  }
}
