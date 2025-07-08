<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# VancedStream

VancedStream es una API construida con [NestJS](https://nestjs.com/) que permite hacer streaming de archivos de video directamente desde enlaces magnet de torrents, utilizando [WebTorrent](https://webtorrent.io/).

## Características

- **Streaming de video**: Transmite archivos de video (`.mp4`, `.mkv`, `.webm`, `.avi`) directamente desde un torrent.
- **Soporte de rangos**: Compatible con peticiones HTTP Range para reproducción progresiva.
- **Gestión automática de torrents**: Descarga, mantiene y elimina torrents automáticamente según su uso.
- **API sencilla**: Solo necesitas un enlace magnet para comenzar a reproducir.

## Instalación

```bash
npm install
```

## Uso

### Ejecutar en desarrollo

```bash
npm run start:dev
```

### Ejecutar en producción

```bash
npm run start:prod
```

## Endpoints

### `GET /?magnet=<MAGNET>&range=<RANGE>`

- **magnet**: (obligatorio) Enlace magnet del torrent.
- **range**: (opcional) Cabecera HTTP Range para streaming parcial.

#### Ejemplo de uso

```http
GET /?magnet=magnet:?xt=urn:btih:... HTTP/1.1
Range: bytes=0-1048575
```

La respuesta será un stream del archivo de video encontrado en el torrent.

## Estructura principal

- `src/app.controller.ts`: Controlador principal, expone el endpoint de streaming.
- `src/app.service.ts`: Lógica de gestión de torrents.
- `src/stream.service.ts`: Lógica de streaming y manejo de archivos.
- `src/torrent.service.ts`: Servicio alternativo para gestión de torrents (no usado por defecto).

## Licencia

MIT
