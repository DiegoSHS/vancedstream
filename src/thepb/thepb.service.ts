import { Injectable } from "@nestjs/common";
import { TPBMovie, TPBtoTorrent } from "./dto/movie.dto.js";

@Injectable()
export class ThePBService {
    async getTPBMovies(title: string) {
        try {
            const res = await fetch(`${process.env.TPB_URL}?q=${title}&cat=207`)
            const data: TPBMovie[] = await res.json()
            return data.map(TPBtoTorrent)
        } catch (error) {
            return []
        }
    }
}