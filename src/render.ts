import type { GameState, Cell, Particle } from './game'

const W = 160, H = 144
const CELL_W = 30, CELL_H = 20

// Player sprite (from /public/player.png)
const playerImg = new Image();
playerImg.src = '/player.png';
let playerReady = false;
playerImg.onload = () => { playerReady = true; };

function drawPlayer(ctx: CanvasRenderingContext2D, x:number, y:number){
  // scale PNG to cell-relative size
  const w = Math.round(0.75 * CELL_W);  // ~22 px
  const h = Math.round(1.50 * CELL_H);  // ~30 px
  if(playerReady){
    ctx.drawImage(playerImg, x - Math.floor(w/2), y - h, w, h);
  } else {
    // fallback silhouette
    ctx.fillStyle = '#191919';
    ctx.fillRect(x - Math.floor(w/2), y - h, w, h);
  }
}


export function render(ctx: CanvasRenderingContext2D, s: GameState){
  (ctx as any).imageSmoothingEnabled = false;
  
  // Screen shake
  if (s.shakeIntensity > 0) {
    ctx.save()
    const shake = s.shakeIntensity
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    )
  }
  
  // bakgrunn
  ctx.clearRect(0,0,W,H)
  
  // Gradient bakgrunn
  const gradient = ctx.createLinearGradient(0, 0, 0, H)
  gradient.addColorStop(0, '#f8fafc')
  gradient.addColorStop(1, '#e2e8f0')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, H)
  
  // LCD inaktive celler (lysere ruter)
  ctx.save();
  ctx.globalAlpha = 1.0;
  for(let x=0;x<3;x++){
    for(let y=1;y<3;y++){
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      const cellX = 16 + x*42
      const cellY = 32 + (y-1)*32
      ctx.fillRect(cellX, cellY, 30, 22);
      ctx.strokeRect(cellX, cellY, 30, 22);
    }
  }
  ctx.restore();

  // vinduer (topp‑ramme)
  for(let x=0;x<3;x++){
    drawWindow(ctx, 16 + x*42, 8)
  }

  // tegn aktører (hoppere)
  for(const a of s.actors){
    if(!a.alive) continue
    const pos = a.path[Math.min(a.i, a.path.length-1)]
    const xy = cellToXY(pos)
    // Bounce animasjon
    const bounce = Math.sin(a.bouncePhase) * 2
    drawJumper(ctx, xy.x, xy.y + bounce)
  }

  // Tegn partikler
  for (const p of s.particles) {
    drawParticle(ctx, p)
  }

  // spiller-skygge
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(16 + s.playerPos*42 + 15, 140, Math.round(0.6*CELL_W), Math.round(0.25*CELL_H), 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // duk/spiller nederst
  drawPlayer(ctx, 16 + s.playerPos*42 + 15, 136)

  // Combo display
  if (s.combo >= 3) {
    ctx.save()
    ctx.fillStyle = '#059669'
    ctx.font = 'bold 10px ui-monospace, monospace'
    ctx.textAlign = 'center'
    const alpha = Math.min(1, s.comboTimer / 500)
    ctx.globalAlpha = alpha
    ctx.fillText(`COMBO x${s.combo}!`, 80, 25)
    ctx.restore()
  }

  // Miss-ikoner
  drawMissIcons(ctx, s.misses);

  // «Game Over» overlay
  if(!s.running && (s.misses >= 3)){
    ctx.save()
    ctx.globalAlpha = 0.95
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 50, 160, 44)
    
    // Border
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 50, 160, 44)
    
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', 80, 68)
    ctx.font = '10px ui-monospace, monospace'
    ctx.fillText(`Poeng: ${s.score} • Perfekte: ${s.perfectCatches}`, 80, 82)
    ctx.fillText('Trykk Reset for ny runde', 80, 92)
    ctx.restore()
  }
  
  if (s.shakeIntensity > 0) {
    ctx.restore()
  }
}

function cellToXY(c: Cell){
  // GRID_H kan variere; vi map'er 0..(GRID_H-1) til skjermhøyde.
  // Topp-start ~18px, dy ~20px slik at bunn (y=5) havner rundt 118px.
  const dy = 20
  const x = 16 + c.x*42 + 15
  const y = 18 + c.y*dy
  return { x, y }
}


function rect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number){
  ctx.fillStyle = '#191919'
  ctx.fillRect(x,y,w,h)
}

function drawWindow(ctx: CanvasRenderingContext2D, x:number, y:number){
  ctx.save();
  
  // Bygning/hus bakgrunn
  ctx.fillStyle = '#475569';
  ctx.fillRect(x-5, y-15, 40, 25); // hus-struktur
  
  // Tak
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(x-8, y-15);
  ctx.lineTo(x+15, y-25);
  ctx.lineTo(x+38, y-15);
  ctx.closePath();
  ctx.fill();
  
  // Tak-skygge
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(x+15, y-25);
  ctx.lineTo(x+38, y-15);
  ctx.lineTo(x+35, y-15);
  ctx.lineTo(x+15, y-22);
  ctx.closePath();
  ctx.fill();
  
  // Vindu-ramme
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, 30, 10);
  
  // Vindu-glass
  ctx.fillStyle = '#0ea5e9';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(x+2, y+2, 26, 6);
  
  // Vindu-karm (vertikal deling)
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x+14, y+1, 2, 8);
  
  // Vindu-glans
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x+3, y+2, 10, 2);
  ctx.fillRect(x+17, y+2, 10, 2);
  
  ctx.restore();
}


function drawJumper(ctx: CanvasRenderingContext2D, x:number, y:number){
  // Forbedret figur med mer detaljer
  const w = Math.round(0.50 * CELL_W); // ~15
  const h = Math.round(0.90 * CELL_H); // ~18
  const left = x - Math.floor(w/2);
  const top = y - Math.floor(h*0.8);
  ctx.save();
  
  ctx.globalAlpha = 1
  ctx.fillStyle = '#1e293b';
  
  // hode
  const head = Math.round(h*0.33);
  ctx.fillRect(left + Math.round(w*0.3), top, Math.round(w*0.4), head);
  
  // kropp
  const bodyH = Math.round(h*0.45);
  ctx.fillRect(left + Math.round(w*0.4), top + head, Math.round(w*0.2), bodyH);
  
  // armer
  ctx.fillRect(left + 1, top + head + 3, Math.round(w*0.35), 2);
  ctx.fillRect(left + Math.round(w*0.65), top + head + 3, Math.round(w*0.35)-1, 2);
  
  // bein
  ctx.fillRect(left + Math.round(w*0.3), top + head + bodyH, 2, Math.round(h*0.22));
  ctx.fillRect(left + Math.round(w*0.7)-2, top + head + bodyH, 2, Math.round(h*0.22));
  
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  const alpha = p.life / p.maxLife
  ctx.globalAlpha = alpha
  ctx.fillStyle = p.color
  const size = 2 + alpha * 2
  ctx.fillRect(p.x - size/2, p.y - size/2, size, size)
  ctx.restore()
}

function drawTrampoline(ctx: CanvasRenderingContext2D, x:number, y:number){
  ctx.save()
  ctx.fillStyle = '#191919'
  ctx.fillRect(x, y, 30, 4)
  // håndtak
  ctx.fillRect(x-6, y-6, 6, 2)
  ctx.fillRect(x+30, y-6, 6, 2)
  ctx.restore()
}


function drawMissIcons(ctx: CanvasRenderingContext2D, misses:number){
  for(let i=0;i<3;i++){
    const x = 120 + i*12, y = 6;
    ctx.save()
    ctx.globalAlpha = i < misses ? 1 : 0.3;
    ctx.fillStyle = i < misses ? '#dc2626' : '#94a3b8';
    
    // X-form
    ctx.lineWidth = 2
    ctx.strokeStyle = ctx.fillStyle
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 8, y + 8)
    ctx.moveTo(x + 8, y)
    ctx.lineTo(x, y + 8)
    ctx.stroke()
    ctx.restore()
  }
}
