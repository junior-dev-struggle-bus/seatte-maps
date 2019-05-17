'use strict';

async function promiseTimeout(msec) {
  return new Promise((resolve)=> setTimeout(resolve));
}

onmessage = async function(evt) {
  const {
    sbColors,
    intersections,
    roads,
    points,
  } = evt.data;


  const pointNumbers = points.map(v=> {
    const p = v.split(',').map(parseFloat);
    return {x: p[0], y: p[1]};
  });

  console.log({intersections, roads, pointNumbers});

  function intersectionDistance(a, b) {
    const pa = pointNumbers[intersections.get(a.location)]
  }


  const uColors = new Uint32Array(sbColors);

  uColors.forEach((v, i , a)=> a[i] = 0x00000000);

  const start = [...intersections.keys()][(Math.random() * intersections.size) >>> 0];
  const finish = [...intersections.keys()][(Math.random() * intersections.size) >>> 0];
  uColors[intersections.get(start).location] = 0xFF0000FF;
  uColors[intersections.get(finish).location] = 0xFF00FF00;

  const bestNodes = [start];
  const visitedNodes = new Set();

  while(bestNodes.length) {
    await promiseTimeout(10);
    const currentIntersection = bestNodes.pop();
    visitedNodes.add(currentIntersection);
    const newIntersections = new Set();
    for(let node of intersections.get(currentIntersection).nodes) {
      const road = roads.get(node);
      //console.log(road);
      newIntersections.add(road.F_INTR_ID);
      newIntersections.add(road.T_INTR_ID);
    }

    for(let node of newIntersections.values()) {
      if(visitedNodes.has(node)) {
        continue;
      }
      uColors[intersections.get(node).location] = 0xFFFF0000;
      bestNodes.push(node);
    }
  }
};