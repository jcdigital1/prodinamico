import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { ModelCalibration } from '../types';

// Standard 300 DPI 10x10cm target dimension
export const PLATE_CANVAS_SIZE = 1181;

// Image cache to avoid re-fetching same base artwork repeatedly
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
 * Unified rendering engine: Renders artwork + clean QR background + dynamic QR + plate number onto a Canvas
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
  if (!ctx) throw new Error('Não foi possível inicializar contexto 2D');

  // 1. Draw Base Artwork
  const baseImg = await loadArtworkImage(calibration.imageUrl);
  ctx.drawImage(baseImg, 0, 0, size, size);

  // Scaling factor relative to 800px base design
  const scale = size / 800;

  // 2. Prepare QR Box coordinates (proportional percentage converted to canvas size)
  const qrX = (calibration.qrBox.x / 100) * size;
  const qrY = (calibration.qrBox.y / 100) * size;
  const qrW = (calibration.qrBox.size / 100) * size;
  const qrH = qrW; // Square QR area

  // 3. Clear background to completely erase and mask any old illustrative QR
  if (calibration.qrBox.clearBg) {
    ctx.save();
    ctx.fillStyle = calibration.qrBox.bgColor || '#FFFFFF';
    const radius = (calibration.qrBox.borderRadius || 12) * scale;

    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrW, qrH, radius);
    ctx.fill();

    // Subtle drop shadow / border for high-end look
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();
    ctx.restore();
  }

  // 4. Generate high-resolution Dynamic QR Code
  const qrPadding = (calibration.qrBox.padding || 8) * scale;
  const qrInnerX = qrX + qrPadding;
  const qrInnerY = qrY + qrPadding;
  const qrInnerSize = qrW - qrPadding * 2;

  // Generate QR code off-screen at high resolution
  const qrDataUrl = await QRCode.toDataURL(qrRedirectUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: Math.round(qrInnerSize * 2), // 2x supersampling for razor sharpness
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const qrImg = await loadArtworkImage(qrDataUrl);
  ctx.drawImage(qrImg, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize);

  // 5. Render Unique Plate Number
  const numConfig = calibration.numberBox;
  const numX = (numConfig.x / 100) * size;
  const numY = (numConfig.y / 100) * size;
  const fontSize = (numConfig.fontSize || 22) * scale;
  const text = `${numConfig.prefix || ''}${formattedNumber}`;

  ctx.save();
  ctx.font = `${numConfig.fontWeight || 'bold'} ${fontSize}px ${numConfig.fontFamily || 'monospace'}`;
  ctx.textAlign = numConfig.align || 'center';
  ctx.textBaseline = 'middle';

  // Measure text for background tag if enabled
  if (numConfig.showBg) {
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const tagPaddingX = 14 * scale;
    const tagPaddingY = 6 * scale;
    const tagHeight = fontSize + tagPaddingY * 2;
    const tagWidth = textWidth + tagPaddingX * 2;

    let tagX = numX - tagWidth / 2;
    if (numConfig.align === 'left') tagX = numX;
    if (numConfig.align === 'right') tagX = numX - tagWidth;

    const tagY = numY - tagHeight / 2;

    ctx.fillStyle = numConfig.bgColor || 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 6 * scale);
    ctx.fill();

    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(255, 30, 30, 0.4)';
    ctx.stroke();
  }

  // Draw Number text
  ctx.fillStyle = numConfig.color || '#FFFFFF';
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
    // Remove header to store pure base64 in zip
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`PLACA-${plate.formattedNumber}.png`, base64Data, { base64: true });
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Export batch as A4 PDF with 4 plates per sheet (2x2 grid, each 10x10 cm, centered on A4)
 * A4 dimensions: 210 x 297 mm.
 * 2 columns: 100mm + 100mm = 200mm. Margin X = (210 - 200) / 2 = 5mm.
 * 2 rows: 100mm + 100mm = 200mm. Margin Y = (297 - 200) / 2 = 48.5mm.
 */
export async function exportBatchPdfA4(
  calibration: ModelCalibration,
  plates: Array<{ formattedNumber: string; qrRedirectUrl: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  // A4 portrait in millimeters
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const plateSizeMm = 100; // 10 x 10 cm = 100 x 100 mm
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
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const col = slotIdx % 2; // 0 or 1
      const row = Math.floor(slotIdx / 2); // 0 or 1

      const posX = marginX + col * plateSizeMm;
      const posY = marginY + row * plateSizeMm;

      doc.addImage(imgData, 'JPEG', posX, posY, plateSizeMm, plateSizeMm);

      // Subtle cutting guide line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.rect(posX, posY, plateSizeMm, plateSizeMm);
    }
  }

  return doc.output('blob');
}
