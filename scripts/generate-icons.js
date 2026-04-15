const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');

// MasterBook icon — purple gradient book with "M"
const iconSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C5DFA"/>
      <stop offset="100%" style="stop-color:#9B8AFB"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1024" height="1024" rx="220" fill="url(#bg)"/>
  <!-- Book shape -->
  <rect x="280" y="240" width="464" height="544" rx="32" fill="rgba(255,255,255,0.15)"/>
  <rect x="280" y="240" width="232" height="544" rx="32" fill="rgba(255,255,255,0.1)"/>
  <!-- Spine line -->
  <line x1="512" y1="260" x2="512" y2="764" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
  <!-- Letter M -->
  <text x="512" y="580" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="320" fill="white" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>`;

// Foreground for adaptive icon (no background, transparent)
const foregroundSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Book shape -->
  <rect x="280" y="240" width="464" height="544" rx="32" fill="rgba(255,255,255,0.15)"/>
  <rect x="280" y="240" width="232" height="544" rx="32" fill="rgba(255,255,255,0.1)"/>
  <line x1="512" y1="260" x2="512" y2="764" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
  <text x="512" y="580" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="320" fill="white" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>`;

// Splash icon (smaller, centered)
const splashSVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7C5DFA"/>
      <stop offset="100%" style="stop-color:#9B8AFB"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg2)"/>
  <rect x="140" y="120" width="232" height="272" rx="16" fill="rgba(255,255,255,0.15)"/>
  <rect x="140" y="120" width="116" height="272" rx="16" fill="rgba(255,255,255,0.1)"/>
  <line x1="256" y1="130" x2="256" y2="382" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <text x="256" y="290" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="160" fill="white" text-anchor="middle" dominant-baseline="middle">M</text>
</svg>`;

// Favicon
const faviconSVG = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#7C5DFA"/>
  <text x="32" y="42" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="36" fill="white" text-anchor="middle">M</text>
</svg>`;

async function generate() {
  // Main icon (1024x1024)
  await sharp(Buffer.from(iconSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('✓ icon.png');

  // Adaptive icon foreground (1024x1024)
  await sharp(Buffer.from(foregroundSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // Splash icon (512x512)
  await sharp(Buffer.from(splashSVG))
    .resize(512, 512)
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✓ splash-icon.png');

  // Favicon (64x64)
  await sharp(Buffer.from(faviconSVG))
    .resize(64, 64)
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('\nAll icons generated!');
}

generate().catch(console.error);
