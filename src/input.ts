import type { GameState } from './game'

export function setupInput(canvas: HTMLCanvasElement, state: GameState, onStart: ()=>void){
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowLeft'){ queue(-1) }
    else if(e.key === 'ArrowRight'){ queue(+1) }
    else if(e.key === 'Enter' || e.key === ' '){ onStart() }
    else if(e.key.toLowerCase() === 'p'){ state.running = !state.running }
  })

  function queue(dir: -1|1){
    // enkel 1-trykk buffer: hvis ingen pending, legg inn; ellers overskriv med siste retning
    state.pendingDir = dir
  }

  // Touch: venstre/høyre halvdel → queue
  const rectFor = ()=> canvas.getBoundingClientRect()
  const touch = (clientX: number, clientY: number)=>{
    const r = rectFor()
    const x = clientX - r.left
    const half = r.width/2
    if(x < half) queue(-1); else queue(+1)
    onStart()
  }
  canvas.addEventListener('pointerdown', (e)=>{
    canvas.setPointerCapture(e.pointerId)
    touch(e.clientX, e.clientY)
  })
}
