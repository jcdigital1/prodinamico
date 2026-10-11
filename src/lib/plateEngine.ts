import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { ModelCalibration } from '../types';

// Standard 300 DPI 10x10cm target resolution (1181 x 1181 px)
export const PLATE_CANVAS_SIZE = 1181;

// Artwork image cache to avoid repeated network/file overhead
const imageCache: Map<string, HTMLImageElement> = new Map();

export async function loadArtworkImage(url: string): Promise<HTMLImageElement> {
  if (imageCache.has(url)) {
    const cached = imageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) return cached;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = (e) => {
      reject(new Error(`Falha ao carregar arte base: ${url}. ${e}`));
    };
    img.src = url;
  });
}

/**
 * Unified rendering engine:
 * Layer 1: Clean base artwork
 * Layer 2: Seamless background wipe over the exact illustrative QR box
 * Layer 3: Dynamic razor-sharp QR code with proper quiet zone
 * Layer 4: Discreet, elegant corner plate number (NO box, NO dark background)
 */
export async function renderPlateToCanvas(
  calibration: ModelCalibration,
  qrRedirectUrl: string,
  formattedNumber: string,
  targetCanvas?: HTMLCanvasElement,
  size: number = PLATE_CANVAS_SIZE
): Promise<HTMLCanvasElement> {
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível obter contexto 2D');

  // 1. Draw Base Artwork
  const baseImg = await loadArtworkImage(calibration.imageUrl);
  ctx.drawImage(baseImg, 0, 0, size, size);

  // Proportional scale factor
  const scale = size / 800;

  // 2. Exact QR Box coordinates
  const qrX = (calibration.qrBox.x / 100) * size;
  const qrY = (calibration.qrBox.y / 100) * size;
  const qrW = (calibration.qrBox.size / 100) * size;
  const qrH = qrW;

  // 3. Clear the illustrative QR code with its designated clean background
  if (calibration.qrBox.clearBg) {
    ctx.save();
    ctx.fillStyle = calibration.qrBox.bgColor || '#FFFFFF';
    const radius = (calibration.qrBox.borderRadius || 8) * scale;

    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrW, qrH, radius);
    ctx.fill();
    ctx.restore();
  }

  // 4. Generate & Draw the Dynamic QR Code exactly within the calibrated box
  const qrPadding = (calibration.qrBox.padding || 6) * scale;
  const qrInnerX = qrX + qrPadding;
  const qrInnerY = qrY + qrPadding;
  const qrInnerSize = Math.max(10, qrW - qrPadding * 2);

  // High-resolution supersampled QR code (errorCorrectionLevel 'M' for optimal scanning and crisp matrix)
  const qrDataUrl = await QRCode.toDataURL(qrRedirectUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: Math.round(qrInnerSize * 2),
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const qrImg = await loadArtworkImage(qrDataUrl);
  ctx.drawImage(qrImg, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize);

  // 5. Render Discreet, Elegant Numbering (NO box, NO dark background, clean corner)
  const numConfig = calibration.numberBox;
  const numX = (numConfig.x / 100) * size;
  const numY = (numConfig.y / 100) * size;
  const fontSize = (numConfig.fontSize || 13) * scale;
  const text = `${numConfig.prefix || 'Nº '}${formattedNumber}`;

  ctx.save();
  ctx.font = `${numConfig.fontWeight || '600'} ${fontSize}px ${numConfig.fontFamily || 'system-ui, -apple-system, sans-serif'}`;
  ctx.textAlign = numConfig.align || 'left';
  ctx.textBaseline = 'middle';

  // If showBg is explicitly enabled in calibration (default is false)
  if (numConfig.showBg && numConfig.bgColor && numConfig.bgColor !== 'transparent') {
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const padX = 8 * scale;
    const padY = 3 * scale;
    const tagH = fontSize + padY * 2;
    const tagW = textWidth + padX * 2;

    let tagX = numX;
    if (numConfig.align === 'center') tagX = numX - tagW / 2;
    if (numConfig.align === 'right') tagX = numX - tagW;
    const tagY = numY - tagH / 2;

    ctx.fillStyle = numConfig.bgColor;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, tagH, 4 * scale);
    ctx.fill();
  } else {
    // Subtle shadow for clean legibility against any artwork color without a box
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetX = 1 * scale;
    ctx.shadowOffsetY = 1 * scale;
  }

  ctx.fillStyle = numConfig.color || '#E2E8F0';
  ctx.fillText(text, numX, numY);
  ctx.restore();

  return canvas;
}

/**
 * Export a single plate as high-res PNG (10x10 cm, 300 DPI, 1181x1181 px)
 */
export async function exportPlatePng(
  calibration: ModelCalibration,
  qrRedirectUrl: string,
  formattedNumber: string
): Promise<Blob> {
  const canvas = await renderPlateToCanvas(calibration, qrRedirectUrl, formattedNumber);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Erro ao gerar blob PNG da plaquinha'));
    }, 'image/png');
  });
}

/**
 * Trigger file download in browser
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export entire batch as a ZIP of individual PNGs (e.g. PLACA-000001.png)
 */
export async function exportBatchZip(
  calibration: ModelCalibration,
  plates: Array<{ formattedNumber: string; qrRedirectUrl: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('Plaquinhas-Dinamico-Pro') || zip;

  for (let i = 0; i < plates.length; i++) {
    const plate = plates[i];
    if (onProgress) onProgress(i + 1, plates.length);

    const canvas = await renderPlateToCanvas(calibration, plate.qrRedirectUrl, plate.formattedNumber);
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`PLACA-${plate.formattedNumber}.png`, base64Data, { base64: true });
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Export entire batch as A4 PDF with exactly 4 plates per page in a 2x2 grid.
 * Page format: A4 (210 x 297 mm)
 * Plate dimensions: exactly 100 x 100 mm (10 x 10 cm) each
 * Margins:
 * 2 columns = 200 mm width. Horizontal margin = (210 - 200) / 2 = 5 mm.
 * 2 rows = 200 mm height. Vertical margin = (297 - 200) / 2 = 48.5 mm.
 * Col 0: X = 5 mm, Col 1: X = 105 mm.
 * Row 0: Y = 48.5 mm, Row 1: Y = 148.5 mm.
 * Automatically adds additional pages for batches with > 4 plates (e.g. 20 plates = 5 pages).
 */
export async function exportBatchPdfA4(
  calibration: ModelCalibration,
  plates: Array<{ formattedNumber: string; qrRedirectUrl: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const plateSizeMm = 100; // 10 x 10 cm
  const marginX = (210 - 200) / 2; // 5 mm
  const marginY = (297 - 200) / 2; // 48.5 mm

  const platesPerPage = 4;
  const totalPages = Math.ceil(plates.length / platesPerPage);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    const pagePlates = plates.slice(pageIdx * platesPerPage, (pageIdx + 1) * platesPerPage);

    for (let slotIdx = 0; slotIdx < pagePlates.length; slotIdx++) {
      const overallIndex = pageIdx * platesPerPage + slotIdx;
      if (onProgress) onProgress(overallIndex + 1, plates.length);

      const plate = pagePlates[slotIdx];
      const canvas = await renderPlateToCanvas(calibration, plate.qrRedirectUrl, plate.formattedNumber);
      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      const col = slotIdx % 2; // 0 or 1
      const row = Math.floor(slotIdx / 2); // 0 or 1

      const posX = marginX + col * plateSizeMm;
      const posY = marginY + row * plateSizeMm;

      doc.addImage(imgData, 'JPEG', posX, posY, plateSizeMm, plateSizeMm);
    }
  }

  return doc.output('blob');
}
