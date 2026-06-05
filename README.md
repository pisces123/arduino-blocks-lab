# Arduino Blocks Lab

Open-source Arduino block coding, inspired by the friendliness of LEGO SPIKE and styled around bright Arduino blue.

## What is included

- React + Vite web app with Blockly, live Arduino C++ output, lessons, wiring hints, and project save/load.
- Node local agent wrapping `arduino-cli` for board detection, all Arduino CLI FQBN targets, library/core install, compile, upload, and serial monitor.
- Shared TypeScript packages for block-pack schemas, the V1 hardware catalog, and Arduino C++ generation.
- GitHub Pages deployment workflow for the public web app.

## Public web app

The web app is designed to deploy from GitHub Pages. After the first successful `main` workflow run, it will be available at:

```text
https://pisces123.github.io/arduino-blocks-lab/
```

The web app can create projects and generate Arduino C++ on its own. To program real USB boards from the public site, run the local agent below.

## Run it

```bash
npm install
npm run dev
```

The web app runs on `http://localhost:5173`, and the local agent runs on `http://127.0.0.1:47631`.

Install `arduino-cli` separately if you want compile/upload to real boards:

```bash
brew install arduino-cli
npm run dev:agent
```

The agent exposes a localhost API only. It lets the hosted web app detect boards, search Arduino CLI board targets, prepare cores and libraries, compile, upload, and open the serial monitor.

## Test it

```bash
npm test
npm run build
```

## Open source

Arduino Blocks Lab is released under the MIT License. Contributions can add new block packs through the extension format in `docs/extension-format.md`.
