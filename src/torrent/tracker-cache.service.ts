import { Injectable, OnModuleInit, OnModuleDestroy, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '../common/logger/logger.service.js';
import { HTTP_TRACKERS, UDP_TRACKERS, WSS_TRACKERS } from '../constants.js';
import { SaveHashDto } from './dto/save-hash.dto.js';

/**
 * TrackerCacheService
 * Responsibility: Manage tracker storage in Redis with high read/write performance
 * - Store trackers in Redis SET to prevent duplicates automatically
 * - Initialize with trackers from constants.ts on startup
 */
@Injectable()
export class TrackerCacheService extends Redis implements OnModuleInit, OnModuleDestroy {
    private readonly TRACKERS_KEY = 'torrent:trackers';
    private readonly HASHES_KEY = 'torrent:hashes'

    constructor(private readonly logger: LoggerService) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        super(redisUrl, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.on('error', (err) => {
            this.logger.error('Redis connection error', err, 'TrackerCacheService');
        });

        this.on('connect', () => {
            this.logger.info('Redis connected', 'TrackerCacheService');
        });
    }

    /**
     * Initialize tracker cache on module startup
     * Loads default trackers from constants.ts if set is empty
     */
    async onModuleInit() {
        try {
            const exists = await this.exists(this.TRACKERS_KEY);
            const count = exists ? await this.scard(this.TRACKERS_KEY) : 0
            const trackers = [
                ...HTTP_TRACKERS,
                ...UDP_TRACKERS,
                ...WSS_TRACKERS,
            ]
            if (count < trackers.length) {
                await this.addTrackersFromArray(trackers);
            }
            this.logger.info('Initializing tracker cache with default trackers', 'TrackerCacheService');
            const updatedCount = await this.scard(this.TRACKERS_KEY)
            this.logger.info(`Tracker cache initialized with ${updatedCount} trackers`, 'TrackerCacheService');
        } catch (error) {
            this.logger.error('Error initializing tracker cache', error, 'TrackerCacheService');
            throw error;
        }
    }

    /**
     * Close Redis connection on module destroy
     */
    async onModuleDestroy() {
        await this.quit();
        this.logger.info('Redis connection closed', 'TrackerCacheService');
    }

    /**
     * Add a single tracker to cache if it doesn't exist
     * Returns true if tracker was added, false if it already existed
     */
    async addTracker(tracker: string): Promise<boolean> {
        try {
            const added = await this.sadd(this.TRACKERS_KEY, tracker);
            return added > 0;
        } catch (error) {
            this.logger.error(`Error adding tracker: ${tracker}`, error, 'TrackerCacheService');
            throw new InternalServerErrorException('Failed to add tracker to cache');
        }
    }

    /**
     * Add multiple trackers from an array
     * Duplicates are automatically handled by Redis SET
     */
    async addTrackersFromArray(trackers: string[]): Promise<number> {
        try {
            if (trackers.length === 0) return 0;
            const added = await this.sadd(this.TRACKERS_KEY, ...trackers);
            return added;
        } catch (error) {
            this.logger.error('Error adding trackers from array', error, 'TrackerCacheService');
            throw new InternalServerErrorException('Failed to add trackers from array');
        }
    }

    /**
     * Get all trackers from cache
     */
    getAllTrackers() {
        try {
            return this.smembers(this.TRACKERS_KEY);
        } catch (error) {
            this.logger.error('Error getting all trackers', error, 'TrackerCacheService');
            throw new InternalServerErrorException('Failed to get trackers from cache');
        }
    }

    /**
     * Get tracker count
     */
    getTrackerCount() {
        try {
            return this.scard(this.TRACKERS_KEY);
        } catch (error) {
            this.logger.error('Error getting tracker count', error, 'TrackerCacheService');
            throw new InternalServerErrorException('Failed to get tracker count');
        }
    }

    /**
     * Remove a tracker from cache
     */
    async removeTracker(tracker: string): Promise<boolean> {
        try {
            const removed = await this.srem(this.TRACKERS_KEY, tracker);
            return removed > 0;
        } catch (error) {
            this.logger.error(`Error removing tracker: ${tracker}`, error, 'TrackerCacheService');
            throw new InternalServerErrorException('Failed to remove tracker from cache');
        }
    }

    /**
     * Clear all trackers from cache
     */
    clearAll() {
        try {
            this.del(this.TRACKERS_KEY);
            this.logger.info('Tracker cache cleared', 'TrackerCacheService');
        } catch (error) {
            this.logger.error('Error clearing tracker cache', error, 'TrackerCacheService');
            throw new InternalServerErrorException('Failed to clear tracker cache');
        }
    }
    async setTorrentHash(name: string, hash: string) {
        try {
            const value = JSON.stringify({
                name,
                hash,
            })
            const res = await this.sadd(this.HASHES_KEY, value);
            this.logger.info(`Hash ${hash} for movie ${name} set successfully`, 'TrackerCacheService');
            return res;
        } catch (error) {
            this.logger.error(`Error setting hash for movie: ${name}`, error, 'TrackerCacheService');
            throw new InternalServerErrorException(`Failed to set hash for movie: ${name}`);
        }
    }
    async getTorrentHashes() {
        try {
            const hashes = await this.smembers(this.HASHES_KEY);
            if (!hashes.length) {
                this.logger.warn(`No hashes found`, 'TrackerCacheService');
                return []
            }
            const parsedResults = hashes.map<SaveHashDto>(hash => JSON.parse(hash))
            return parsedResults;
        } catch (error) {
            this.logger.error(`Error getting hashes`, error, 'TrackerCacheService');
            throw new InternalServerErrorException(`Failed to get hashes`);
        }
    }
}
