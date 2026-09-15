import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixelFn) {
  // RGBA buffer: 4 bytes per pixel
  // PNG scanline: 1 filter byte (0) + width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = createChunk('IDAT', deflated);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing function for the Islamic Crescent & Star Salati icon
function renderSalatiIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates to -1 to +1
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);
  const dist = Math.sqrt(nx * nx + ny * ny);

  // Base background: Deep emerald gradient (#064e3b -> #02241b)
  const gradFactor = (ny + 1) / 2;
  let bgR = Math.round(6 * (1 - gradFactor * 0.5));
  let bgG = Math.round(78 * (1 - gradFactor * 0.5));
  let bgB = Math.round(59 * (1 - gradFactor * 0.6));

  if (!isMaskable && dist > 0.96) {
    // Subtle rounded corner cutoff if not maskable
    const cornerRadius = 0.4;
    const qx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
    const qy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }
  }

  // Safe zone scaling factor for maskable
  const scale = isMaskable ? 0.72 : 0.85;
  const sx = nx / scale;
  const sy = ny / scale;
  const sDist = Math.sqrt(sx * sx + sy * sy);

  // Outer Golden Ring
  if (sDist >= 0.88 && sDist <= 0.92) {
    return [245, 158, 11, 255]; // Amber Gold
  }
  if (sDist >= 0.83 && sDist <= 0.84) {
    return [252, 211, 77, 200]; // Inner thin gold ring
  }

  // Crescent Moon: Center 1 around (-0.05, -0.08), radius ~0.48
  // Subtract inner sphere around (0.12, -0.16), radius ~0.42
  const c1x = sx - (-0.04);
  const c1y = sy - (-0.06);
  const d1 = Math.sqrt(c1x * c1x + c1y * c1y);

  const c2x = sx - 0.14;
  const c2y = sy - (-0.14);
  const d2 = Math.sqrt(c2x * c2x + c2y * c2y);

  if (d1 < 0.46 && d2 > 0.38) {
    // Inside Crescent
    // Golden gradient
    return [254, 240, 138, 255];
  }

  // Islamic 8-Point Star
  const starCx = 0.28;
  const starCy = -0.22;
  const stx = sx - starCx;
  const sty = sy - starCy;
  const starDist = Math.sqrt(stx * stx + sty * sty);
  if (starDist < 0.11) {
    const angle = Math.atan2(sty, stx);
    const rMod = 0.06 + 0.05 * Math.cos(8 * angle);
    if (starDist < rMod) {
      return [254, 240, 138, 255];
    }
  }

  // Mosque Dome silhouette in lower section
  if (sy > 0.25 && sy < 0.65) {
    const domeW = (1 - (sy - 0.25) / 0.4);
    if (Math.abs(sx) < (0.28 * Math.sin(Math.PI * Math.max(0, 1 - (sy - 0.25) / 0.4)))) {
      return [16, 185, 129, 90]; // Soft emerald highlight
    }
  }

  // Base emerald background
  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. 192x192 PNG
const png192 = createPng(192, 192, (x, y, w, h) => renderSalatiIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('Created pwa-192x192.png');

// 2. 512x512 PNG
const png512 = createPng(512, 512, (x, y, w, h) => renderSalatiIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('Created pwa-512x512.png');

// 3. 512x512 Maskable PNG (full bleed background, padded safe zone)
const pngMaskable512 = createPng(512, 512, (x, y, w, h) => renderSalatiIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable512);
console.log('Created pwa-maskable-512x512.png');

// 4. 180x180 Apple Touch Icon PNG
const pngApple180 = createPng(180, 180, (x, y, w, h) => renderSalatiIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple180);
console.log('Created apple-touch-icon.png');

// 5. favicon.ico / favicon.png
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);
console.log('Created favicon.ico');
