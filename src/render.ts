import type { GameState, Cell } from './game'

const W = 160, H = 144

// Player sprite (from /public/player.png)
const playerImg = new Image();
playerImg.src = '/player.png';
let playerReady = false;
playerImg.onload = () => { playerReady = true; };

function drawPlayer(ctx: CanvasRenderingContext2D, x:number, y:number){
  // Draw centered over x; y represents baseline (feet)
  const w = 32, h = 48;
  if(playerReady){
    ctx.drawImage(playerImg, x - Math.floor(w/2), y - h, w, h);
  } else {
    // fallback silhouette
    ctx.fillStyle = '#191919';
    ctx.fillRect(x-15, y-8, 30, 8);
  }
}


export function render(ctx: CanvasRenderingContext2D, s: GameState){
  // bakgrunn
  ctx.clearRect(0,0,W,H)
  // rutenett-guides (svak)
  ctx.save()
  ctx.globalAlpha = 0.08
  for(let x=0;x<3;x++){
    for(let y=0;y<3;y++){
      rect(ctx, 16 + x*42, 16 + y*32, 30, 22)
    }
  }
  ctx.restore()

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

  // duk/spiller nederst
  drawPlayer(ctx, 16 + s.playerPos*42 + 15, 136)

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

}

function rect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number){
  ctx.fillStyle = '#191919'
  ctx.fillRect(x,y,w,h)
}

function drawWindow(ctx: CanvasRenderingContext2D, x:number, y:number){
  ctx.save()
  ctx.fillStyle = '#191919'
  ctx.fillRect(x, y, 30, 10)
  ctx.restore()
}

function drawJumper(ctx: CanvasRenderingContext2D, x:number, y:number){
  // 1‑bit stil: enkel «pinnemann»
  ctx.save()
  ctx.fillStyle = '#191919'
  // hode
  ctx.fillRect(x-2, y-10, 4, 4)
  // kropp
  ctx.fillRect(x-1, y-6, 2, 8)
  // armer
  ctx.fillRect(x-5, y-6, 4, 2)
  ctx.fillRect(x+1, y-6, 4, 2)
  // bein
  ctx.fillRect(x-3, y+0, 2, 4)
  ctx.fillRect(x+1, y+0, 2, 4)
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
