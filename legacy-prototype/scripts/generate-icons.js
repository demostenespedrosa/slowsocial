import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve('public/icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Master Icon SVG (Standard & Apple Touch Icon - Squircle with subtle depth)
const standardIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient Lilás Pastel Apple -->
    <linearGradient id="bgGrad" x1="120" y1="80" x2="904" y2="944" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9C87E2" />
      <stop offset="50%" stop-color="#7C65C1" />
      <stop offset="100%" stop-color="#5E46A7" />
    </linearGradient>

    <!-- Top Glow / Apple Frosted Depth -->
    <linearGradient id="topHighlight" x1="512" y1="40" x2="512" y2="520" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <!-- Emblem Inner Gradient -->
    <linearGradient id="emblemGrad" x1="280" y1="280" x2="744" y2="744" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F2EEFC" />
    </linearGradient>

    <!-- Sombra Suave do Emblema -->
    <filter id="emblemShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#34226C" flood-opacity="0.38" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#21134B" flood-opacity="0.25" />
    </filter>

    <!-- Sombra Externa do Squircle -->
    <filter id="squircleShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="24" stdDeviation="36" flood-color="#24154E" flood-opacity="0.22" />
    </filter>
  </defs>

  <!-- Fundo Apple Squircle (Continuous Curvature) -->
  <rect x="36" y="36" width="952" height="952" rx="224" fill="url(#bgGrad)" />
  <rect x="36" y="36" width="952" height="952" rx="224" fill="url(#topHighlight)" />
  <rect x="36" y="36" width="952" height="952" rx="224" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="4" />

  <!-- Emblema Central: Infinito / Conexão Serena / Slow Leaf -->
  <g filter="url(#emblemShadow)">
    <!-- Loop Orgânico Infinito do Slow Social -->
    <path
      d="M370 360 C 270 360, 210 430, 210 512 C 210 594, 270 664, 370 664 C 470 664, 520 570, 560 512 C 600 454, 650 360, 750 360 C 850 360, 910 430, 910 512 C 910 594, 850 664, 750 664 C 650 664, 600 570, 560 512 C 520 454, 470 360, 370 360 Z"
      fill="none"
      stroke="url(#emblemGrad)"
      stroke-width="72"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Núcleo Central: Ponto de Presença / Mindfulness Pearl -->
    <circle cx="512" cy="512" r="38" fill="url(#emblemGrad)" />

    <!-- Mini Centelha de Inspiração Sutil -->
    <circle cx="370" cy="512" r="22" fill="#EADFFB" opacity="0.9" />
    <circle cx="750" cy="512" r="22" fill="#EADFFB" opacity="0.9" />
  </g>
</svg>
`;

// 2. Maskable Icon SVG (Android Adaptive Icon - Fills full canvas without rounded borders, emblem within safe 66-80% zone)
const maskableIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="maskGrad" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9C87E2" />
      <stop offset="50%" stop-color="#7C65C1" />
      <stop offset="100%" stop-color="#5E46A7" />
    </linearGradient>
    <linearGradient id="emblemGradM" x1="300" y1="300" x2="724" y2="724" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#F2EEFC" />
    </linearGradient>
    <filter id="shadowM" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="22" flood-color="#34226C" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Fundo Total para Recorte Adaptativo do Android -->
  <rect width="1024" height="1024" fill="url(#maskGrad)" />

  <!-- Conteúdo seguro centralizado na zona de 65-75% -->
  <g transform="translate(102, 102) scale(0.8)" filter="url(#shadowM)">
    <path
      d="M370 360 C 270 360, 210 430, 210 512 C 210 594, 270 664, 370 664 C 470 664, 520 570, 560 512 C 600 454, 650 360, 750 360 C 850 360, 910 430, 910 512 C 910 594, 850 664, 750 664 C 650 664, 600 570, 560 512 C 520 454, 470 360, 370 360 Z"
      fill="none"
      stroke="url(#emblemGradM)"
      stroke-width="72"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="512" cy="512" r="38" fill="url(#emblemGradM)" />
    <circle cx="370" cy="512" r="22" fill="#EADFFB" opacity="0.9" />
    <circle cx="750" cy="512" r="22" fill="#EADFFB" opacity="0.9" />
  </g>
</svg>
`;

async function generate() {
  console.log('Gerando ícones PWA...');

  // Salvar SVG principal
  fs.writeFileSync(path.resolve('public/favicon.svg'), standardIconSvg.trim());
  fs.writeFileSync(path.resolve('public/icons/icon.svg'), standardIconSvg.trim());

  // Configurações de tamanhos padrão
  const standardSizes = [
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'icon-72x72.png', size: 72 },
    { name: 'icon-96x96.png', size: 96 },
    { name: 'icon-128x128.png', size: 128 },
    { name: 'icon-144x144.png', size: 144 },
    { name: 'icon-152x152.png', size: 152 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-384x384.png', size: 384 },
    { name: 'icon-512x512.png', size: 512 },
  ];

  for (const { name, size } of standardSizes) {
    const outPath = path.resolve('public/icons', name);
    await sharp(Buffer.from(standardIconSvg))
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(outPath);
    console.log(`✓ Gerado: ${name} (${size}x${size})`);
  }

  // Também criar apple-touch-icon na raiz de public para compatibilidade máxima com Safari
  await sharp(Buffer.from(standardIconSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.resolve('public/apple-touch-icon.png'));

  // Maskable icons para Android
  const maskableSizes = [
    { name: 'icon-maskable-192x192.png', size: 192 },
    { name: 'icon-maskable-512x512.png', size: 512 },
  ];

  for (const { name, size } of maskableSizes) {
    const outPath = path.resolve('public/icons', name);
    await sharp(Buffer.from(maskableIconSvg))
      .resize(size, size)
      .png({ quality: 100 })
      .toFile(outPath);
    console.log(`✓ Gerado: ${name} (Maskable ${size}x${size})`);
  }

  console.log('Todos os ícones PWA foram gerados com sucesso!');
}

generate().catch((err) => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
});
