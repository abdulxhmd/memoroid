# Memoroid

Memoroid — create Polaroid / Instax style printed keepsakes with handwriting overlays.

## Quick start (local)
1. `npm install`
2. `npm run dev`
3. Open http://localhost:3000

## Notes
- Add a TTF handwriting font at `public/fonts/AmaticSC-Regular.ttf`. Or change path in `app/api/generate/route.ts`.
- `sharp` may require native build tools (libvips). If install fails, see sharp docs or run in a Docker container with libvips installed.

## Manual test checklist
1. Upload sample image (under 12MB).
2. Crop the image; check that cropData is produced.
3. Toggle drawing mode, draw with stylus/mouse, check pressure indicator.
4. Click Generate — expect a PNG to be downloaded and visible on `/download`.
5. Open PNG in image viewer — confirm drawing aligns and dimensions match preset.

## Developer tests
Run `npm test` to run unit tests for mapping math.
