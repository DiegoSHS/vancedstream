import { Injectable } from "@nestjs/common";
import { Torrent, TPBMovie } from "./dto/movie.dto.js";
import { LoggerService } from "../common/logger/logger.service.js";
import { formatBytes, getQualityFromName, parseName, parseSeedPeers } from "./utils/thepb.utils.js";

@Injectable()
export class ThePBService {
    constructor(private readonly logger: LoggerService) { }

    TPBtoTorrent(input: TPBMovie): Torrent {
        return {
            url: '',
            hash: input.info_hash,
            audio_channels: '',
            bit_depth: '',
            quality: getQualityFromName(input.name),
            date_uploaded: input.added,
            date_uploaded_unix: 0,
            is_repack: '',
            peers: parseSeedPeers(input.leechers),
            seeds: parseSeedPeers(input.seeders),
            size: formatBytes(parseInt(input.size), 1),
            size_bytes: parseInt(input.size),
            video_codec: '',
            type: input.name
        }
    }
    filterTorrentsBySeeding(torrent: Torrent) {
        return torrent.seeds > 2 && torrent.peers > 2
    }
    async getTPBMovies(title: string) {
        try {
            const res = await fetch(`${process.env.TPB_URL}?q=${title}&cat=207`)
            if (!res.ok) {
                this.logger.warn(`Failed - code ${res.status}: ${res.statusText}`, "ThePBService")
                return []
            }
            const data: TPBMovie[] = await res.json()
            if (!data.length) {
                this.logger.info("No torrents found", "ThePBService")
                return []
            }
            const parsedTitle = title.replace(/\:/, '').toLowerCase()
            console.log(parseName(data[0].name), parsedTitle)
            const filtered = data
                .map(this.TPBtoTorrent)
                .filter(this.filterTorrentsBySeeding)
                .filter(item => parseName(item.type) === parsedTitle)
            this.logger.info(`${filtered.length} torrents found`, "ThePBService")
            return filtered
        } catch (error) {
            this.logger.warn("Error retrieving torrents", "ThePBService")
            return []
        }
    }
}