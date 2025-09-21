export type Mode = 'A'|'B'
export type Cell = { x: number; y: number }
export type Actor = { path: Cell[]; i: number; alive: boolean }
export type GameState = {
  tickMs: number
  score: number
  misses: number // 0..3
  mode: Mode
  running: boolean
  playerPos: 0|1|2 // 3 bakkeposisjoner
  actors: Actor[]
  spawnTimer: number
  spawnInterval: number
  rng: number
}

const GRID_W = 3
const GRID_H = 4 // 0..3, y=3 er bakken/kollisjonssjekk

// tre vertikale baner (vinduer over duken)
const SPAWNS: Cell[][] = [
  [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3}],
  [{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:1,y:3}],
  [{x:2,y:0},{x:2,y:1},{x:2,y:2},{x:2,y:3}],
]

export function initGame(mode: Mode): GameState{
  return {
    tickMs: 180,
    score: 0,
    misses: 0,
    mode,
    running: false,
    playerPos: 1,
    actors: [],
    spawnTimer: 0,
    spawnInterval: mode === 'A' ? 1200 : 900,
    rng: 0xC0FFEE,
  }
}

export function resetGame(s: GameState): GameState{
  return initGame(s.mode)
}

export function toggleMode(s: GameState): GameState{
  return initGame(s.mode === 'A' ? 'B' : 'A')
}

function rand(s: GameState): number{
  // xorshift-ish
  let x = s.rng | 0
  x ^= x << 13; x ^= x >> 17; x ^= x << 5
  s.rng = x >>> 0
  return (s.rng % 1000) / 1000
}

function spawnActor(s: GameState){
  const lane = Math.floor(rand(s) * 3) as 0|1|2
  const path = SPAWNS[lane]
  s.actors.push({ path, i: 0, alive: true })
}

export function update(s: GameState){
  // tid går bare hvis spillet kjører
  if(!s.running) return

  s.spawnTimer += s.tickMs
  const maxSimult = s.mode === 'A' ? 1 : 2

  // spawn ved intervall, begrens antall samtidig
  if(s.spawnTimer >= s.spawnInterval && s.actors.filter(a=>a.alive).length < maxSimult){
    s.spawnTimer = 0
    spawnActor(s)
  }

  for(const a of s.actors){
    if(!a.alive) continue
    a.i++
    const pos = a.path[Math.min(a.i, a.path.length-1)]
    // Sjekk om nådde bakken (y=3). Kollisjon hvis spillerpos = pos.x
    if(pos.y >= GRID_H-1){
      if(pos.x === s.playerPos){
        s.score++
      } else {
        s.misses++
        if(s.misses >= 3){
          s.running = FalseLike(false) // game over
        }
      }
      a.alive = false
    }
  }

  // fjern døde for å holde lista kort
  if(s.actors.length > 20){
    s.actors = s.actors.filter(a => a.alive)
  }

  // tempoopptrapping
  const minTick = 90
  s.tickMs = Math.max(minTick, 180 - Math.floor(s.score/10)*5)
  // Intervall raskere med score
  const minInterval = s.mode === 'A' ? 600 : 450
  s.spawnInterval = Math.max(minInterval, (s.mode==='A'?1200:900) - s.score*4)
}

// liten hack for å unngå treffe TS-narrowing på boolean
function FalseLike(v: boolean){ return v }
