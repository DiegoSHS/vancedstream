/**
 * Streaming configuration and constants
 * Responsibility: Configuration management
 */

export const WEBTORRENT = 'WebTorrent'

// Torrent lifecycle constants - optimized for memory
export const TORRENT_CLEANUP_INTERVAL_MS = 30 * 1000;      // 30 segundos (cleanup más frecuente)
export const TORRENT_EXPIRATION_MS = 5 * 60 * 1000;        // 5 minutos (expiración más rápida)
export const TORRENT_READY_TIMEOUT_MS = 60 * 1000;         // 1 minuto para que el torrent esté listo

export const STREAM_CONFIG = {
    // Progressive streaming buffer thresholds
    progressiveBufferThresholds: {
        initial: 20 * 1024 * 1024,     // 20 MB - límite máximo de buffer inicial (vídeos largos)
    },

    // Dynamic chunk sizes based on video quality
    chunkSizes: {
        low: 1024 * 1024 * 1,      // 1 MB  - Mobile/Low quality
        medium: 1024 * 1024 * 2,   // 2 MB  - Standard quality (default)
        high: 1024 * 1024 * 4,     // 4 MB  - HD (720p/1080p)
        ultra: 1024 * 1024 * 8,    // 8 MB  - 4K/UHD y vídeos muy pesados
    },

    // MIME types for supported video formats
    mimeTypes: {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.avi': 'video/x-msvideo',
    },

    // Regular expressions
    patterns: {
        videoFileRegex: /\.(mp4|mkv|webm|avi)$/i,
        rangeRegex: /bytes=(\d+)-?(\d+)?/,
    },

    // Timeout values
    timeouts: {
        progressiveBuffer: 30000, // 30 seconds
    },

    // Check intervals
    intervals: {
        bufferCheck: 500, // 500ms
    },
} as const;

export const HTTP_TRACKERS: string[] = [
    "https://tracker.yemekyedim.com:443/announce",
    "https://tracker.pmman.tech:443/announce",
    "https://tracker.moeblog.cn:443/announce",
    "https://tracker.linvk.com:443/announce",
    "https://tracker.leechshield.link:443/announce",
    "https://tracker.itscraftsoftware.my.id:443/announce",
    "https://tracker.ghostchu-services.top:443/announce",
    "https://tracker.gcrenwp.top:443/announce",
    "https://tracker.expli.top:443/announce",
    "https://tracker.bt4g.com:443/announce",
    "https://sparkle.ghostchu-services.top:443/announce",
    "http://www.torrentsnipe.info:2701/announce",
    "http://www.genesis-sp.org:2710/announce",
    "http://wepzone.net:6969/announce",
    "http://tracker810.xyz:11450/announce",
    "http://tracker2.dler.org:80/announce",
    "http://tracker1.itzmx.com:8080/announce",
    "http://tracker.zhuqiy.top:80/announce",
    "http://tracker.dler.org:6969/announce",
    "http://tracker.dler.com:6969/announce",
    "http://tracker.opentrackr.org:1337/announce",
    "http://tracker.xiaoduola.xyz:6969/announce",
    "http://tracker.waaa.moe:6969/announce",
    "http://tracker.vanitycore.co:6969/announce",
    "http://tracker.sbsub.com:2710/announce",
    "http://tracker.renfei.net:8080/announce",
    "http://tracker.qu.ax:6969/announce",
    "http://tracker.mywaifu.best:6969/announce",
    "http://tracker.moxing.party:6969/announce",
    "http://tracker.lintk.me:2710/announce",
    "http://tracker.ipv6tracker.org:80/announce",
    "http://tracker.ghostchu-services.top:80/announce",
    "http://tracker.dmcomic.org:2710/announce",
    "http://tracker.corpscorp.online:80/announce",
    "http://tracker.bz:80/announce",
    "http://tracker.bt4g.com:2095/announce",
    "http://tracker.bt-hash.com:80/announce",
    "http://tracker.bittor.pw:1337/announce",
    "http://tracker.23794.top:6969/announce",
    "http://tr.kxmp.cf:80/announce",
    "http://taciturn-shadow.spb.ru:6969/announce",
    "http://t.overflow.biz:6969/announce",
    "http://t.jaekr.sh:6969/announce",
    "http://shubt.net:2710/announce",
    "http://share.hkg-fansub.info:80/announce.php",
    "http://servandroidkino.ru:80/announce",
    "http://seeders-paradise.org:80/announce",
    "http://retracker.spark-rostov.ru:80/announce",
    "http://public.tracker.vraphim.com:6969/announce",
    "http://p4p.arenabg.com:1337/announce",
    "http://open.trackerlist.xyz:80/announce",
    "http://home.yxgz.club:6969/announce",
    "http://highteahop.top:6960/announce",
    "http://finbytes.org:80/announce.php",
    "http://buny.uk:6969/announce",
    "http://bt1.xxxxbt.cc:6969/announce",
    "http://bt.poletracker.org:2710/announce",
    "http://bittorrent-tracker.e-n-c-r-y-p-t.net:1337/announce",
    "http://0d.kebhana.mx:443/announce",
    "http://0123456789nonexistent.com:80/announce",
]

export const UDP_TRACKERS: string[] = [
    "udp://open.demonii.com:1337/announce",
    "udp://open.stealth.si:80/announce",
    "udp://exodus.desync.com:6969/announce",
    "udp://tracker.torrent.eu.org:451/announce",
    "udp://explodie.org:6969/announce",
    "udp://wepzone.net:6969/announce",
    "udp://ttk2.nbaonlineservice.com:6969/announce",
    "udp://tracker2.dler.org:80/announce",
    'udp://tracker.opentrackr.org:1337',
    "udp://tracker.opentrackr.org:1337/announce",
    "udp://tracker.tryhackx.org:6969/announce",
    "udp://tracker.therarbg.to:6969/announce",
    "udp://tracker.theoks.net:6969/announce",
    "udp://tracker.srv00.com:6969/announce",
    "udp://tracker.qu.ax:6969/announce",
    "udp://tracker.ololosh.space:6969/announce",
    "udp://tracker.gmi.gd:6969/announce",
    "udp://tracker.gigantino.net:6969/announce",
    "udp://tracker.fnix.net:6969/announce",
    "udp://tracker.filemail.com:6969/announce",
    "udp://tracker.dump.cl:6969/announce",
    "udp://tracker.dler.org:6969/announce",
    "udp://tracker.bittor.pw:1337/announce",
    "udp://tracker.torrust-demo.com:6969/announce",
    "udp://tracker.ddunlimited.net:6969/announce",
    "udp://tr4ck3r.duckdns.org:6969/announce",
    "udp://tracker-udp.gbitt.info:80/announce",
    "udp://t.overflow.biz:6969/announce",
    "udp://retracker01-msk-virt.corbina.net:80/announce",
    "udp://retracker.lanta.me:2710/announce",
    "udp://public.tracker.vraphim.com:6969/announce",
    "udp://p4p.arenabg.com:1337/announce",
    "udp://opentracker.io:6969/announce",
    "udp://open.free-tracker.ga:6969/announce",
    "udp://open.dstud.io:6969/announce",
    "udp://ns-1.x-fins.com:6969/announce",
    "udp://martin-gebhardt.eu:25/announce",
    "udp://isk.richardsw.club:6969/announce",
    "udp://ipv4.rer.lol:2710/announce",
    "udp://evan.im:6969/announce",
    "udp://discord.heihachi.pw:6969/announce",
    "udp://d40969.acod.regrucolo.ru:6969/announce",
    "udp://bt.ktrackers.com:6666/announce",
    "udp://bittorrent-tracker.e-n-c-r-y-p-t.net:1337/announce",
    "udp://bandito.byterunner.io:6969/announce",
    "udp://1c.premierzal.ru:6969/announce",
    "udp://p2p.publictracker.xyz:6969/announce",
    "udp://ipv4announce.sktorrent.eu:6969/announce",
    "udp://concen.org:6969/announce",
    "udp://bt.rer.lol:6969/announce",
    "udp://bt.rer.lol:2710/announce",
]

export const WSS_TRACKERS: string[] = [
    "wss://tracker.btorrent.xyz",
    "wss://tracker.fastcast.nz",
    "wss://tracker.webtorrent.dev",
    "wss://tracker.files.fm:7073/announce",
    "ws://tracker.files.fm:7072/announce"
]