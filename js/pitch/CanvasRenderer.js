import {
  GRID_COLS, GRID_ROWS, COLORS,
  LEFT_COL_TOP, LEFT_COL_BOTTOM, RIGHT_COL_TOP, RIGHT_COL_BOTTOM
} from './constants.js';
import { showToast } from '../ui/Toast.js';

export class CanvasRenderer {
  constructor(pitchEl, gameState) {
    this.pitchEl = pitchEl;
    this.gameState = gameState;
  }

  async captureToClipboard() {
    const rect = this.pitchEl.getBoundingClientRect();
    const scale = 2;
    const W = rect.width * scale;
    const H = rect.height * scale;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const cw = rect.width / GRID_COLS;
    const ch = rect.height / GRID_ROWS;

    // Draw cells
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const row1 = r + 1;
        const even = row1 % 2 === 0;
        let color;
        if (row1 === 1) color = even ? COLORS.endLeftEven : COLORS.endLeftOdd;
        else if (row1 === GRID_ROWS) color = even ? COLORS.endRightEven : COLORS.endRightOdd;
        else color = even ? COLORS.fieldEven : COLORS.fieldOdd;
        ctx.fillStyle = color;
        ctx.fillRect(c * cw, r * ch, cw, ch);

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(c * cw, r * ch, cw, ch);
      }
    }

    // Scrimmage line (horizontal between rows 13 and 14)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 13 * ch);
    ctx.lineTo(GRID_COLS * cw, 13 * ch);
    ctx.stroke();

    // Wide zone dashed lines (vertical between cols 4/5 and 11/12)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [3, 10].forEach(c => {
      ctx.beginPath();
      ctx.moveTo((c + 1) * cw, 0);
      ctx.lineTo((c + 1) * cw, GRID_ROWS * ch);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Kick target X marks at (col=8, row=7) and (col=8, row=20) — 0-indexed: c=7, r=6 and c=7, r=19
    [[7, 6], [7, 19]].forEach(([c, r]) => {
      const cx = (c + 0.5) * cw, cy = (r + 0.5) * ch;
      const sz = Math.min(cw, ch) * 0.35;
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - sz, cy - sz);
      ctx.lineTo(cx + sz, cy + sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + sz, cy - sz);
      ctx.lineTo(cx - sz, cy + sz);
      ctx.stroke();
    });

    // Distance markers in left col (c=0) and right col (c=14)
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${ch * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [k, v] of Object.entries(LEFT_COL_TOP))
      ctx.fillText(v, 0.5 * cw, (k - 0.5) * ch);
    for (const [k, v] of Object.entries(LEFT_COL_BOTTOM))
      ctx.fillText(v, 0.5 * cw, (k - 0.5) * ch);
    for (const [k, v] of Object.entries(RIGHT_COL_TOP))
      ctx.fillText(v, 14.5 * cw, (k - 0.5) * ch);
    for (const [k, v] of Object.entries(RIGHT_COL_BOTTOM))
      ctx.fillText(v, 14.5 * cw, (k - 0.5) * ch);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, rect.width, rect.height);

    // Draw players
    this.gameState.players.forEach(p => {
      const c = p.col - 1;
      const r = p.row - 1;
      const cx = (c + 0.5) * cw;
      const cy = (r + 0.5) * ch;
      const radius = Math.min(cw, ch) * 0.38;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.team === 'red' ? COLORS.teamRed : COLORS.teamBlue;
      ctx.fill();

      ctx.strokeStyle = p.outlineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${radius * 1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.number, cx, cy);
    });

    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('Copied to clipboard');
      } catch (err) {
        console.error('Clipboard write failed:', err);
      }
    }, 'image/png');
  }
}
