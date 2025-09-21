import { initGame, update, toggleMode, resetGame, type GameState } from './game'
import { render } from './render'
import { setupInput } from './input'

const canvas = document.getElementById('screen') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const ui = {
  score: document.getElementById('score')!,
  miss: document.getElementById('miss')!,
  mode: document.getElementById('mode')!,
  start: document.getElementById('startBtn') as HTMLButtonElement,
  pause: document.getElementById('pauseBtn') as HTMLButtonElement,
  reset: document.getElementById('resetBtn') as HTMLButtonElement,
  modeBtn: document.getElementById('modeBtn') as HTMLButtonElement,
}

let state: GameState = initGame('A')
let last = performance.now()
let acc = 0

function loop(now: number){
  const dt = now - last; last = now
  acc += dt
  while(acc >= state.tickMs){
    update(state)
    acc -= state.tickMs
  }
  render(ctx, state)
  ui.score.textContent = String(state.score)
  ui.miss.textContent = String(state.misses)
  ui.mode.textContent = state.mode

  requestAnimationFrame(loop)
}

ui.start.addEventListener('click', ()=>{ state.running = true })
ui.pause.addEventListener('click', ()=>{ state.running = !state.running })
ui.reset.addEventListener('click', ()=>{ state = resetGame(state) })
ui.modeBtn.addEventListener('click', ()=>{ state = toggleMode(state) })

setupInput(canvas, state, () => { state.running = true })

requestAnimationFrame(loop)
