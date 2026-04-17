import { Injectable } from "@nestjs/common";
import { TPBMovie, TPBtoTorrent } from "./dto/movie.dto.js";
import { LoggerService } from "../common/logger/logger.service.js";

@Injectable()
export class ThePBService {
    constructor(private readonly logger: LoggerService) { }
    async getTPBMovies(title: string) {
        try {
            const res = await fetch(`${process.env.TPB_URL}?q=${title}&cat=207`)
            const data: TPBMovie[] = await res.json()
            if (!data.length) {
                this.logger.info("[PBService] No torrents found")
                return []
            }
            return data.map(TPBtoTorrent)
        } catch (error) {
            this.logger.warn("Error retrieving torrents")
            return []
        }
    }
}