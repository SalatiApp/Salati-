import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixelFn) {
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0;
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

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function renderSalatiIcon(x, y, w, h, isRound = false) {
  const cx = w / 2;
  const cy = h / 2;
  const nx = (x - cx) / (w / 2);
  const ny = (y - cy) / (h / 2);
  const dist = Math.sqrt(nx * nx + ny * ny);

  if (isRound && dist > 0.98) {
    return [0, 0, 0, 0];
  }

  if (!isRound && dist > 0.96) {
    const cornerRadius = 0.35;
    const qx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
    const qy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > cornerRadius) {
      return [0, 0, 0, 0];
    }
  }

  const gradFactor = (ny + 1) / 2;
  let bgR = Math.round(6 * (1 - gradFactor * 0.5));
  let bgG = Math.round(78 * (1 - gradFactor * 0.5));
  let bgB = Math.round(59 * (1 - gradFactor * 0.6));

  const scale = 0.85;
  const sx = nx / scale;
  const sy = ny / scale;
  const sDist = Math.sqrt(sx * sx + sy * sy);

  if (sDist >= 0.88 && sDist <= 0.92) {
    return [245, 158, 11, 255];
  }
  if (sDist >= 0.83 && sDist <= 0.84) {
    return [252, 211, 77, 200];
  }

  const c1x = sx - (-0.04);
  const c1y = sy - (-0.06);
  const d1 = Math.sqrt(c1x * c1x + c1y * c1y);

  const c2x = sx - 0.14;
  const c2y = sy - (-0.14);
  const d2 = Math.sqrt(c2x * c2x + c2y * c2y);

  if (d1 < 0.46 && d2 > 0.38) {
    return [254, 240, 138, 255];
  }

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

  if (sy > 0.25 && sy < 0.65) {
    if (Math.abs(sx) < (0.28 * Math.sin(Math.PI * Math.max(0, 1 - (sy - 0.25) / 0.4)))) {
      return [16, 185, 129, 90];
    }
  }

  return [bgR, bgG, bgB, 255];
}

const resDir = path.resolve('android/app/src/main/res');

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

for (const [folder, size] of Object.entries(iconSizes)) {
  const targetFolder = path.join(resDir, folder);
  if (fs.existsSync(targetFolder)) {
    const standardPng = createPng(size, size, (x, y, w, h) => renderSalatiIcon(x, y, w, h, false));
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher.png'), standardPng);

    const roundPng = createPng(size, size, (x, y, w, h) => renderSalatiIcon(x, y, w, h, true));
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_round.png'), roundPng);

    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_foreground.png'), standardPng);

    console.log(`Generated icons for ${folder} (${size}x${size})`);
  }
}

// Splash screens
const splashSizes = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
};

for (const [folder, [sw, sh]] of Object.entries(splashSizes)) {
  const targetFolder = path.join(resDir, folder);
  if (fs.existsSync(targetFolder)) {
    // Generate splash with emerald background and centered emblem
    const splashPng = createPng(sw, sh, (x, y, w, h) => {
      const minDim = Math.min(w, h);
      const emblemSize = minDim * 0.45;
      const ex = x - (w - emblemSize) / 2;
      const ey = y - (h - emblemSize) / 2;
      if (ex >= 0 && ex < emblemSize && ey >= 0 && ey < emblemSize) {
        const pixel = renderSalatiIcon(ex, ey, emblemSize, emblemSize, true);
        if (pixel[3] > 0) return pixel;
      }
      const grad = y / h;
      return [
        Math.round(6 * (1 - grad * 0.5)),
        Math.round(78 * (1 - grad * 0.5)),
        Math.round(59 * (1 - grad * 0.6)),
        255
      ];
    });
    fs.writeFileSync(path.join(targetFolder, 'splash.png'), splashPng);
    console.log(`Generated splash for ${folder}`);
  }
}
