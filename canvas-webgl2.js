class canvas_circle extends HTMLCanvasElement {
  connectedCallback() {
    const offscreen = this.transferControlToOffscreen();
    const sbViewport = new SharedArrayBuffer(16);
    const f32Viewport = new Float32Array(sbViewport);
    f32Viewport[0] = -0.6723739504814148;
    f32Viewport[1] = -0.6095505356788635;
    f32Viewport[2] = 0;
    f32Viewport[3] = 2.499999761581421;

    document.addEventListener('keydown', (ev)=> {
      if(ev.key === 'a') { f32Viewport[0] += 0.01 / 2.0 ** f32Viewport[3]; }
      if(ev.key === 'd') { f32Viewport[0] -= 0.01 / 2.0 ** f32Viewport[3]; }
      if(ev.key === 'w') { f32Viewport[1] -= 0.01 / 2.0 ** f32Viewport[3]; }
      if(ev.key === 's') { f32Viewport[1] += 0.01 / 2.0 ** f32Viewport[3]; }
      if(ev.key === '+') { f32Viewport[3] += 0.1; }
      if(ev.key === '-') { f32Viewport[3] -= 0.1; }
      console.log(ev.key, f32Viewport);
    });

    const worker = new Worker('offscreencanvas.js'); 
    worker.postMessage({offscreen, sbViewport}, [offscreen]);

  }
};

customElements.define('canvas-webgl2', canvas_circle, {extends: 'canvas'});