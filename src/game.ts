export type Mode = 'A'|'B'
export type Cell = { x: number; y: number }
export type Actor = {
  path: Cell[]
  i: number
  alive: boolean
  stepTicks: number   // ticks per rutenett-steg
  stepAcc: number     // akkumulert ticks
  hang: number        // toppheng i ticks
}
export type GameState = {
  tickMs: number
  score: number
  misses: number // 0..3
  mode: Mode
  running: boolean
  playerPos: 0|1|2 // 3 bakkeposisjoner
  prevPlayerPos: 0|1|2 // for grace check
  actors: Actor[]
  spawnTimer: number
  spawnInterval: number
  rng: number
  // enkel input-buffer: brukes av input.ts til å «legge inn» en bevegelse til neste tick
  pendingDir: -1|0|1
}

const GRID_W = 3
const GRID_H = 6 // mer vertikaloppløsning

// tre vertikale baner (vinduer over spilleren). Flere mellomsteg y=0..5
const SPAWNS: Cell[][] = [
  [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:0,y:5}],
  [{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:1,y:3},{x:1,y:4},{x:1,y:5}],
  [{x:2,y:0},{x:2,y:1},{x:2,y:2},{x:2,y:3},{x:2,y:4},{x:2,y:5}],
]

export function initGame(mode: Mode): GameState{
  return {
    tickMs: 200,                // roligere start
    score: 0,
    misses: 0,
    mode,
    running: false,
    playerPos: 1,
    prevPlayerPos: 1,
    actors: [],
    spawnTimer: 0,
    spawnInterval: mode==='A' ? 1400 : 1000, // romsligere
    rng: 0xC0FFEE,
    pendingDir: 0,
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
  const baseStep = 2 // 2 ticks per steg i starten
  const a: Actor = { path, i: 0, alive: true, stepTicks: baseStep, stepAcc: 0, hang: 2 }
  s.actors.push(a)
}

export function update(s: GameState){
  if(!s.running) return

  // lagre forrige pos for grace check
  const lastPos = s.playerPos
  s.prevPlayerPos = lastPos

  // input-buffer: bruk pendingDir (en gang) i starten av tick
  if(s.pendingDir !== 0){
    const next = Math.min(2, Math.max(0, s.playerPos + s.pendingDir)) as 0|1|2
    s.playerPos = next
    s.pendingDir = 0
  }

  s.spawnTimer += s.tickMs
  const maxSimult = s.mode === 'A' ? 1 : 2
  if(s.spawnTimer >= s.spawnInterval && s.actors.filter(a=>a.alive).length < maxSimult){
    s.spawnTimer = 0
    spawnActor(s)
  }

  for(const a of s.actors){
    if(!a.alive) continue

    if(a.hang > 0){
      a.hang-- // vent litt i toppen for å «telegrafere»
    } else {
      a.stepAcc += 1
      if(a.stepAcc >= a.stepTicks){
        a.stepAcc = 0
        a.i++
      }
    }

    const pos = a.path[Math.min(a.i, a.path.length-1)]
    if(pos.y >= GRID_H-1){
      const catchNow = (pos.x === s.playerPos)
      const catchPrev = (pos.x === s.prevPlayerPos) // grace 1 tick
      if(catchNow || catchPrev){
        s.score++
      } else {
        s.misses++
        if(s.misses >= 3){
          s.running = false // game over
        }
      }
      a.alive = false
    }
  }

  // fjern døde med jevne mellomrom
  if(s.actors.length > 24){
    s.actors = s.actors.filter(a => a.alive)
  }

  // Mykere tempo-kurver
  s.tickMs = Math.max(120, 200 - Math.floor(s.score/12)*5)
  const baseInterval = (s.mode==='A'?1400:1000)
  const minInterval = (s.mode==='A'?700:550)
  s.spawnInterval = Math.max(minInterval, baseInterval - s.score*6)

  // Øk fart subtilt i Game B ved å senke stepTicks mot 1
  if(s.mode==='B'){
    for(const a of s.actors){
      a.stepTicks = Math.max(1, 2 - Math.floor(s.score/40))
    }
  }
}
