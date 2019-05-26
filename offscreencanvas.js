'use strict';

function assert(condition) {
  if(condition) { return; }
  throw new Error('assert Failed');
}

async function fetchJSON(url) {
  const response = await fetch(url);
  const ret = response.json();
  return ret;
}

async function PromiseAllObj(obj) {
  const ret = {};
  for(let [k, v] of Object.entries(obj)) {
    ret[k] = await v;
  }
  return ret;
}

async function loadMapFromJSON() {
  const jsonObj = await PromiseAllObj({
    intersections: fetchJSON('./intersections.json'),
    points: fetchJSON('./points.json'),
    roads: fetchJSON('./roads.json'),
  });
  const intersections = new Map(Object.entries(jsonObj.intersections).map(([k, v])=> [parseInt(k, 10), v]));
  const roads = new Map(Object.entries(jsonObj.roads).map(([k, v])=> [parseInt(k, 10), v]));
  const points = jsonObj.points;

  return {
    intersections,
    roads,
    points,
  };
}

async function loadShader(gl, type, url) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, await (await fetch(url)).text());
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new TypeError('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

async function loadProgram(gl, obj) {
  const shaderProgram = gl.createProgram();
  for(let [type, url] of Object.entries(obj)) {
    gl.attachShader(shaderProgram, await loadShader(gl, type, url));
  }
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new TypeError('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

onmessage = async function(evt) {
  const {offscreen, sbViewport}= evt.data;

  const {
    intersections,
    roads,
    points,
  } = await loadMapFromJSON();

  const pointNumbers = points.flatMap(v=> {
    const p = v.split(',').map(parseFloat);
    return [p[0] + 123, p[1] - 47];
  });

  const otherNumbers = [
    -0.5, -0.5,
    +0.5, -0.5,
    +0.5, +0.5,
  ];

  const f32Viewport = new Float32Array(sbViewport);

  const sbColors = new SharedArrayBuffer(2 * pointNumbers.length);
  const uColors = new Uint32Array(sbColors);
  const f32Points = new Float32Array(pointNumbers);
  const elements = [];
  for(let road of roads.values()) {
    for(let i = 1; i < road.points.length; i++) {
      elements.push(road.points[i - 1], road.points[i]);
    }
  }

  const i32Elements = new Uint32Array(elements);

  const gl = offscreen.getContext("webgl2",{
    alpha: false,
    willReadFrequently: false,
    antialias: true,
    depth: true,
    failIfMajorPerformanceCaveat: true,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    stencil: false,
    desynchronized: true,
    preserveDrawingBuffer: true,
  });

  const shaderProgram = await loadProgram(gl, {[gl.VERTEX_SHADER]: 'vertex-shader.glsl', [gl.FRAGMENT_SHADER]: 'fragment-shader.glsl'})
  gl.useProgram(shaderProgram);
  console.log(
    (new Array(gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES)).fill(0).map((v, i)=> gl.getActiveAttrib(shaderProgram, i))),
    (new Array(gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS)).fill(0).map((v, i)=> gl.getActiveUniform(shaderProgram, i))),
  );

  const elementBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, i32Elements, gl.STATIC_DRAW);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, f32Points, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uColors, gl.STATIC_DRAW);
  gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.enableVertexAttribArray(1);


  gl.useProgram(shaderProgram);

  const ulViewport = gl.getUniformLocation(shaderProgram, 'offsetRotScale');

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.BLEND);

  function render(time) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.uniform4fv(ulViewport, f32Viewport);
    gl.bufferData(gl.ARRAY_BUFFER, uColors, gl.STATIC_DRAW);
    gl.drawElements(gl.LINES, i32Elements.length, gl.UNSIGNED_INT, 0);
    //gl.drawElements(gl.POINTS, i32Elements.length, gl.UNSIGNED_INT, 0);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  new Worker('route.js').postMessage({
    intersections,
    roads,
    points,
    sbColors,
  });
};