const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePNG(width, height, drawFn) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const idx = 1 + x * 4;
      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = a;
    }
    rawRows.push(row);
  }

  const uncompressed = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(uncompressed, { level: 9 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

// Draw icon: Modern Bell + Ledger / Checkmark on a #1a73e8 background
function renderIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates to [0, 1]
  const nx = x / w;
  const ny = y / h;

  // Background gradient: rich deep blue to primary brand blue #1a73e8
  // #1a73e8 = rgb(26, 115, 232)
  // darker top/bottom rgb(21, 93, 196)
  const bgR = Math.round(26 - (ny - 0.5) * 10);
  const bgG = Math.round(115 - (ny - 0.5) * 15);
  const bgB = Math.round(232 - (ny - 0.5) * 10);

  // If not maskable, we can optionally have slightly rounded squircle or solid
  // Android & iOS prefer solid full-bleed for icon background
  let baseColor = [bgR, bgG, bgB, 255];

  // Scale factor based on maskable (safe zone is central 80%)
  const scale = isMaskable ? 0.75 : 0.88;
  // Center coordinates relative to center (0.5, 0.5)
  const cx = (nx - 0.5) / scale;
  const cy = (ny - 0.5) / scale;

  // 1. Ledger / Clipboard card background in center:
  // Card bounds: left = -0.36, right = 0.36, top = -0.38, bottom = 0.38
  const cardLeft = -0.34;
  const cardRight = 0.34;
  const cardTop = -0.36;
  const cardBottom = 0.36;
  const cardRadius = 0.08;

  // Signed distance to rounded rectangle
  function sdRoundedBox(px, py, bx, by, r) {
    const qx = Math.abs(px) - bx + r;
    const qy = Math.abs(py) - by + r;
    const dist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    return dist;
  }

  const cardDist = sdRoundedBox(cx, cy, (cardRight - cardLeft) / 2, (cardBottom - cardTop) / 2, cardRadius);

  // Card shadow / glow
  if (cardDist > 0 && cardDist < 0.05) {
    const shadowAlpha = (1 - cardDist / 0.05) * 0.25;
    baseColor = blend(baseColor, [10, 45, 110, 255], shadowAlpha);
  }

  // Inside card (White card with slight cool tint)
  if (cardDist <= 0) {
    const cardWhite = [255, 255, 255, 255];
    const borderSoft = Math.max(0, Math.min(1, -cardDist / 0.005));
    baseColor = blend(baseColor, cardWhite, borderSoft);

    // Card Header Bar (Teal / Emerald gradient for Pembukuan & Keuangan)
    // top part: cy between cardTop and cardTop + 0.16
    if (cy < cardTop + 0.16) {
      const headerColor = [16, 185, 129, 255]; // Emerald-500
      baseColor = blend(baseColor, headerColor, borderSoft);

      // Ledger Title Line
      if (Math.abs(cy - (cardTop + 0.08)) < 0.02 && Math.abs(cx) < 0.22) {
        baseColor = [255, 255, 255, 240];
      }
    }

    // Ledger Rows / Lines (Pembukuan ledger lines)
    const lineYs = [-0.08, 0.02, 0.12, 0.22];
    for (const ly of lineYs) {
      if (Math.abs(cy - ly) < 0.012 && cx > -0.24 && cx < 0.24) {
        // Line color: soft slate blue
        baseColor = [226, 232, 240, 255];
      }
      // Checkmark bullet on left
      if (Math.hypot(cx - (-0.20), cy - ly) < 0.022) {
        baseColor = [59, 130, 246, 255]; // Blue bullet
      }
    }
  }

  // 2. Front Floating Emblem: Glowing Bell (Pengingat) on the bottom-right
  const bellCx = 0.16;
  const bellCy = 0.14;
  const bellDist = Math.hypot(cx - bellCx, cy - bellCy);

  // Bell badge background circle
  const badgeRadius = 0.18;
  const badgeDist = bellDist - badgeRadius;

  // Badge outer shadow
  if (badgeDist > 0 && badgeDist < 0.04) {
    const shadowAlpha = (1 - badgeDist / 0.04) * 0.35;
    baseColor = blend(baseColor, [10, 40, 100, 255], shadowAlpha);
  }

  if (badgeDist <= 0) {
    // Gradient Circle: Amber-500 to Orange-500
    const badgeColor = [245, 158, 11, 255]; // Amber
    const edge = Math.max(0, Math.min(1, -badgeDist / 0.005));
    baseColor = blend(baseColor, badgeColor, edge);

    // Bell shape inside circle
    const bx = (cx - bellCx) / 0.12;
    const by = (cy - bellCy) / 0.12;

    // Top dome of bell
    const inBellDome = (Math.hypot(bx, by + 0.1) < 0.55 && by < 0.28 && by > -0.55);
    // Bell bottom lip
    const inBellLip = (Math.abs(by - 0.28) < 0.08 && Math.abs(bx) < 0.65);
    // Bell clapper
    const inClapper = (Math.hypot(bx, by - 0.44) < 0.18);
    // Bell top ring
    const inTopRing = (Math.hypot(bx, by + 0.65) < 0.18 && Math.hypot(bx, by + 0.65) > 0.08);

    if (inBellDome || inBellLip || inClapper || inTopRing) {
      baseColor = [255, 255, 255, 255];
    }
  }

  return baseColor;
}

function blend(c1, c2, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  return [
    Math.round(c1[0] * (1 - a) + c2[0] * a),
    Math.round(c1[1] * (1 - a) + c2[1] * a),
    Math.round(c1[2] * (1 - a) + c2[2] * a),
    255,
  ];
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192 PNG
console.log('Generating pwa-192x192.png...');
const png192 = makePNG(192, 192, (x, y, w, h) => renderIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Generate 512x512 PNG
console.log('Generating pwa-512x512.png...');
const png512 = makePNG(512, 512, (x, y, w, h) => renderIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Generate 512x512 Maskable PNG
console.log('Generating pwa-maskable-512x512.png...');
const pngMaskable = makePNG(512, 512, (x, y, w, h) => renderIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Generate 180x180 Apple Touch Icon
console.log('Generating apple-touch-icon.png...');
const pngApple = makePNG(180, 180, (x, y, w, h) => renderIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// Generate Scalable SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a73e8"/>
      <stop offset="100%" stop-color="#1557b0"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background with theme color #1a73e8 -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)"/>
  
  <!-- Ledger Card (Pembukuan) -->
  <g filter="url(#shadow)">
    <rect x="96" y="80" width="320" height="352" rx="28" fill="#ffffff"/>
    <!-- Card Header (Emerald for Keuangan) -->
    <path d="M 96,108 C 96,92.5 108.5,80 124,80 L 388,80 C 403.5,80 416,92.5 416,108 L 416,150 L 96,150 Z" fill="#10b981"/>
    <!-- Header Title Bar -->
    <rect x="136" y="105" width="160" height="18" rx="9" fill="#ffffff" fill-opacity="0.9"/>
    
    <!-- Ledger Lines & Checkmarks -->
    <circle cx="140" cy="190" r="12" fill="#1a73e8"/>
    <rect x="170" y="184" width="180" height="12" rx="6" fill="#e2e8f0"/>
    
    <circle cx="140" cy="240" r="12" fill="#1a73e8"/>
    <rect x="170" y="234" width="200" height="12" rx="6" fill="#e2e8f0"/>
    
    <circle cx="140" cy="290" r="12" fill="#1a73e8"/>
    <rect x="170" y="284" width="160" height="12" rx="6" fill="#e2e8f0"/>
    
    <circle cx="140" cy="340" r="12" fill="#1a73e8"/>
    <rect x="170" y="334" width="190" height="12" rx="6" fill="#e2e8f0"/>
  </g>
  
  <!-- Bell Emblem (Pengingat) -->
  <g filter="url(#shadow)" transform="translate(340, 340)">
    <circle cx="0" cy="0" r="76" fill="url(#badgeGrad)"/>
    <!-- Bell Shape -->
    <path d="M -2,-42 C -2,-45 2,-45 2,-42 C 2,-38 12,-34 16,-20 C 20,-6 28,14 36,22 C 38,24 36,28 30,28 L -30,28 C -36,28 -38,24 -36,22 C -28,14 -20,-6 -16,-20 C -12,-34 -2,-38 -2,-42 Z" fill="#ffffff"/>
    <circle cx="0" cy="38" r="8" fill="#ffffff"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
console.log('Generated icon.svg successfully!');
