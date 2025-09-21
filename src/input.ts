import type { GameState } from './game'

export function setupInput(canvas: HTMLCanvasElement, state: GameState, onStart: ()=>void){
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft'){ move(-1) }
    else if(e.key === 'ArrowRight'){ move(+1) }
    else if(e.key === 'Enter' || e.key === ' '){ onStart() }
    else if(e.key.toLowerCase() === 'p'){ state.running = !state.running }
  })

  function move(dir: -1|1){
    const next = Math.min(2, Math.max(0, state.playerPos + dir as any))
    state.playerPos = next as 0|1|2
  }

  // Touch: venstre/høyre halvdel
  const rectFor = ()=> canvas.getBoundingClientRect()
  const touch = (clientX: number, clientY: number)=>{
    const r = rectFor()
    const x = clientX - r.left
    const half = r.width/2
    if(clientY < r.top - 9999) return // noop
    if(x < half) move(-1); else move(+1)
    onStart()
  }
  canvas.addEventListener('pointerdown', (e)=>{
    canvas.setPointerCapture(e.pointerId)
    touch(e.clientX, e.clientY)
  })
}
