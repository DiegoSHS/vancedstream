import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { LoggerService } from '../common/logger/logger.service.js';
import { HTTP_TRACKERS, UDP_TRACKERS, WSS_TRACKERS } from '../constants.js';

/**
 * TrackerCacheService
 * Responsibility: Manage tracker storage in Redis with high read/write performance
 * - Store trackers in Redis SET to prevent duplicates automatically
 * - Initialize with trackers from constants.ts on startup
 */
@Injectable()
export class TrackerCacheService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly TRACKERS_KEY = 'torrent:trackers';

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

            if (!exists) {
                this.logger.info('Initializing tracker cache with default trackers', 'TrackerCacheService');
                await this.addTrackersFromArray([
                    ...HTTP_TRACKERS,
                    ...UDP_TRACKERS,
                    ...WSS_TRACKERS,
                ]);
                const count = await this.scard(this.TRACKERS_KEY);
                this.logger.info(`Tracker cache initialized with ${count} trackers`, 'TrackerCacheService');
            } else {
                const count = await this.scard(this.TRACKERS_KEY);
                this.logger.info(`Tracker cache already exists with ${count} trackers`, 'TrackerCacheService');
            }
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
            throw error;
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
            throw error;
        }
    }

    /**
     * Get all trackers from cache
     */
    async getAllTrackers(): Promise<string[]> {
        try {
            return await this.smembers(this.TRACKERS_KEY);
        } catch (error) {
            this.logger.error('Error getting all trackers', error, 'TrackerCacheService');
            throw error;
        }
    }

    /**
     * Get tracker count
     */
    async getTrackerCount(): Promise<number> {
        try {
            return await this.scard(this.TRACKERS_KEY);
        } catch (error) {
            this.logger.error('Error getting tracker count', error, 'TrackerCacheService');
            throw error;
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
            throw error;
        }
    }

    /**
     * Clear all trackers from cache
     */
    async clearAll(): Promise<void> {
        try {
            await this.del(this.TRACKERS_KEY);
            this.logger.info('Tracker cache cleared', 'TrackerCacheService');
        } catch (error) {
            this.logger.error('Error clearing tracker cache', error, 'TrackerCacheService');
            throw error;
        }
    }
}
