# Arquitectura del Proyecto

## Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Cliente HTTP (Video Player)                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                |
                    GET /?magnet=xxx&progressive=true
                    Headers: Range: bytes=0-1048575
                                |
                                v
┌───────────────────────────────────────────────────────────────────────┐
│                         AppController                                 │
│  Responsabilidad: Punto de entrada HTTP, validación y orquestación   │
└───────────┬───────────────────────────────────────────────┬───────────┘
            |                                               |
            | 1. getOrAddTorrent(magnet)                   |
            v                                               |
┌─────────────────────────────┐                            |
│      TorrentService         │                            |
│  Gestión de torrents        │                            |
├─────────────────────────────┤                            |
│ - getTorrent()              │                            |
│ - addTorrent()              │                            |
│ - getOrAddTorrent()         │                            |
│ - markTorrentAsUsed()       │                            |
│ - cleanupOldTorrents()      │                            |
└──────────┬──────────────────┘                            |
           |                                               |
           | return Torrent                                |
           v                                               |
┌───────────────────────────────────────────────────────────────────┐
│                      WebTorrent Client                            │
│  - Descarga secuencial (strategy: 'sequential')                   │
│  - Múltiples trackers                                             │
│  - Gestión de peers y chunks                                      │
└───────────────────────────────┬───────────────────────────────────┘
                                |
                                | Torrent object
                                v
            ┌────────────────────────────────────────┐
            | 2. getStreamMetadata() o               |
            |    getStreamWithProgressiveLoading()   |
            v                                        |
┌─────────────────────────────────────────────────────────────┐
│                   StreamService                             │
│  Orquestador principal de generación de streams             │
└───┬─────────┬────────────┬───────────────┬─────────────────┘
    |         |            |               |
    | 2.1     | 2.2        | 2.3           | 2.4
    v         v            v               v
┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│FileMeta│ │RangeParse│ │ProgressiveBu│ │StreamCreator │
│Service │ │Service   │ │fferService  │ │Service       │
└────┬───┘ └────┬─────┘ └──────┬───────┘ └──────┬───────┘
     |          |              |                |
     v          v              v                |
┌────────────────────────────────────────────┐  |
│         STREAM_CONFIG (constants.ts)       │  |
│  - chunkSizes (512KB - 4MB dinámico)       │  |
│  - mimeTypes (.mp4, .mkv, .webm, .avi)     │  |
│  - progressiveBufferThresholds (5MB/2MB)   │  |
│  - patterns (regex para video y rangos)    │  |
│  - timeouts (30s progressive)              │  |
└────────────────────────────────────────────┘  |
     |          |              |                |
     v          v              v                |
  findVideo  parseRange   waitForBuffer         |
  +getMime   +getChunk    (5MB inicial)         |
  +getExt    Boundaries   +timeout              |
     |          |              |                |
     └──────────┴──────────────┴────────────────┘
                    |
                    | Metadata: {file, start, end, size, mime}
                    v
            ┌────────────────────────┐
            | 3. createFileStream()  |
            v                        |
┌─────────────────────────────────────────────────┐
│          StreamCreatorService                   │
│  - validateRange(start, end, fileSize)          │
│  - file.createReadStream(start, end)            │
└──────────────────┬──────────────────────────────┘
                   |
                   | Readable Stream
                   v
┌──────────────────────────────────────────────────────────┐
│                 AppController (Return)                   │
│  new StreamableFile(stream, {                            │
│    type: mimeType,                                       │
│    disposition: "inline; filename=...",                  │
│    length: fileSize                                      │
│  })                                                      │
└────────────────────────┬─────────────────────────────────┘
                         |
                         | HTTP Response
                         | Status: 200 (full) o 206 (partial)
                         | Headers: Content-Type, Content-Range
                         | Body: video stream chunks
                         v
┌─────────────────────────────────────────────────────────────┐
│              Cliente HTTP (Video Player)                    │
│  - Recibe chunks progresivamente                            │
│  - Puede solicitar rangos específicos (seek)                │
│  - Buffering automático en navegador                        │
└─────────────────────────────────────────────────────────────┘
```

## Flujo Detallado por Caso de Uso

### Caso 1: Primera Solicitud (Sin Range Header)

1. Cliente solicita: `GET /?magnet=xxx&progressive=true`
2. AppController valida parámetros
3. TorrentService.getOrAddTorrent():
   - Busca torrent en caché (getTorrent)
   - Si no existe, añade con estrategia secuencial
   - Timeout: 60 segundos
4. StreamService.getStreamWithProgressiveLoading():
   - FileMetadataService.findVideoFile() - Busca archivo .mp4/.mkv/.webm/.avi
   - RangeParserService.getChunkBoundaries() - Sin range header: start=0, end=chunkSize-1
   - ProgressiveBufferService.waitForInitialBuffer() - Espera 5MB descargados o timeout 30s
5. StreamCreatorService.createStream(file, 0, chunkSize)
6. Return StreamableFile con Status 200

### Caso 2: Solicitud con Range (Video Seek)

1. Cliente solicita: `GET /?magnet=xxx` con Header `Range: bytes=5242880-10485759`
2. TorrentService retorna torrent desde caché (ya existe)
3. StreamService.getStreamMetadata():
   - FileMetadataService - Obtiene metadata del archivo
   - RangeParserService.parseRange() - Extrae start=5242880, end=10485759
   - Valida rango contra tamaño del archivo
4. StreamCreatorService.createStream(file, 5242880, 10485759)
5. Return StreamableFile con Status 206 Partial Content

### Caso 3: Streaming Estándar (Sin Progressive)

1. Cliente solicita: `GET /?magnet=xxx&progressive=false`
2. TorrentService.getOrAddTorrent() - Espera hasta 60s
3. StreamService.getStreamMetadata() - Sin espera de buffer
4. Retorna stream inmediatamente (puede haber rebuffering si descarga lenta)

## Estructura de Archivos

```
src/
├── main.ts                          Bootstrap de NestJS + Fastify
├── app.controller.ts                Endpoint GET / (streaming)
├── app.module.ts                    Módulo raíz (imports: Stream + Torrent)
├── constants.ts                     STREAM_CONFIG centralizado
│
├── torrent/
│   ├── torrent.module.ts            Exports: TorrentService
│   └── torrent.service.ts           WebTorrent client wrapper
│
└── stream/
    ├── stream.module.ts             Exports: 5 servicios
    ├── stream.service.ts            Orquestador principal
    ├── file-metadata.service.ts     Búsqueda y validación de video
    ├── range-parser.service.ts      Parsing HTTP Range + chunk dinámico
    ├── progressive-buffer.service.ts Monitoreo de descarga (polling)
    └── stream-creator.service.ts    Creación de ReadableStream

test/
    └── app.e2e-spec.ts
```

## Configuración Dinámica (STREAM_CONFIG)

### Chunk Sizes Adaptativos
- Archivos < 100MB: 512KB (móvil/baja calidad)
- Archivos 100MB - 1GB: 1MB (calidad estándar)
- Archivos 1GB - 5GB: 2MB (HD 720p/1080p)
- Archivos > 5GB: 4MB (4K/UHD)

### Progressive Buffer
- Inicial: 5MB (suficiente para reproducción inmediata)
- Mínimo: 2MB (mantener buffer durante playback)
- Prefetch: 10MB (descarga anticipada)
- Timeout: 30 segundos

### Limpieza de Torrents
- Interval: 60 segundos (verificación automática)
- Expiración: 2 minutos sin uso
- Estrategia: Elimina archivos descargados + libera memoria

## Tecnologías Clave

- NestJS 11.x: Framework modular con DI
- Fastify 5.x: HTTP server de alto rendimiento
- WebTorrent 2.6.x: Cliente P2P para navegador/Node.js
- TypeScript: Tipado estático + ES modules
