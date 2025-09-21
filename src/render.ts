import type { GameState, Cell } from './game'

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
  // bakgrunn
  ctx.clearRect(0,0,W,H)
  // LCD inaktive celler (lysere ruter)
  ctx.save();
  ctx.globalAlpha = 1.0;
  for(let x=0;x<3;x++){
    for(let y=1;y<3;y++){
      ctx.fillStyle = '#ece8d6';
      ctx.fillRect(16 + x*42, 32 + (y-1)*32, 30, 22);
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
    drawJumper(ctx, cellToXY(pos).x, cellToXY(pos).y)
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

  // Miss-ikoner
  drawMissIcons(ctx, s.misses);

  // «Game Over» overlay
  if(!s.running && (s.misses >= 3)){
    ctx.save()
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 60, 160, 24)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER — Reset', 80, 76)
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
  ctx.fillStyle = '#191919';
  ctx.fillRect(x, y, 30, 10); // ramme
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(x+2, y+2, 26, 6); // innvendig skygge
  ctx.restore();
}


function drawJumper(ctx: CanvasRenderingContext2D, x:number, y:number){
  // 1-bit silhuett basert på celle-størrelse (ca 15x18 px)
  const w = Math.round(0.50 * CELL_W); // ~15
  const h = Math.round(0.90 * CELL_H); // ~18
  const left = x - Math.floor(w/2);
  const top = y - Math.floor(h*0.8);
  ctx.save();
  ctx.fillStyle = '#191919';
  // hode
  const head = Math.round(h*0.33);
  ctx.fillRect(left + Math.round(w*0.35), top, Math.round(w*0.3), head);
  // kropp
  const bodyH = Math.round(h*0.45);
  ctx.fillRect(left + Math.round(w*0.45)-1, top + head, 2, bodyH);
  // armer
  ctx.fillRect(left + 1, top + head + 2, Math.round(w*0.35), 2);
  ctx.fillRect(left + Math.round(w*0.65), top + head + 2, Math.round(w*0.35)-1, 2);
  // bein
  ctx.fillRect(left + Math.round(w*0.25), top + head + bodyH, 2, Math.round(h*0.2));
  ctx.fillRect(left + Math.round(w*0.75)-2, top + head + bodyH, 2, Math.round(h*0.2));
  ctx.restore();
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
    ctx.globalAlpha = i < misses ? 1 : 0.2;
    ctx.fillStyle = '#191919';
    for(let k=0;k<6;k++){
      ctx.fillRect(x+k, y+k, 1, 1);
      ctx.fillRect(x+6-k, y+k, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}
