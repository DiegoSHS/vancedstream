export interface Torrent {
    url: string;
    hash: string;
    quality: string;
    type: string;
    is_repack: string;
    video_codec: string;
    bit_depth: string;
    audio_channels: string;
    seeds: number;
    peers: number;
    size: string;
    size_bytes: number;
    date_uploaded: string;
    date_uploaded_unix: number;
}

export interface TPBMovie {
    id: string,
    name: string,
    info_hash: string,
    leechers: string,
    seeders: string,
    size: string,
    num_files: string,
    username: string,
    added: string,
    status: string,
    category: string,
    imdb: string
}
