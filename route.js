'use strict';

async function promiseTimeout(msec) {
  return new Promise((resolve)=> setTimeout(resolve, msec));
}

/*
Should really refactor into a CLASS
*/

function breadthFirstSort({start, finish, intersections, roads, pointNumbers}, a, b) {
  function intersectionID_to_gps(id) {
    return pointNumbers[intersections.get(id).location];
  }
  function intersectionDistance(a, b) {
    const pa = intersectionID_to_gps(a);
    const pb = intersectionID_to_gps(b);
    //replace with HAVERSINE
    const ret = Math.sqrt(((pb.x - pa.x) ** 2) + ((pb.y - pa.y) ** 2));
    if(Number.isNaN(ret)) {
      throw new TypeError('no nans!');
    }
    return ret;
  }

  const startGPS = intersectionID_to_gps(start);
  const finishGPS = intersectionID_to_gps(finish);
  const aGPS = intersectionID_to_gps(a);
  const bGPS = intersectionID_to_gps(b);
  const a_to_start = intersectionDistance(a, start);
  const b_to_start = intersectionDistance(b, start);

  return b_to_start - a_to_start;
}

function closestToFinishFirstSort({start, finish, intersections, roads, pointNumbers}, a, b) {
  function intersectionID_to_gps(id) {
    return pointNumbers[intersections.get(id).location];
  }
  function intersectionDistance(a, b) {
    const pa = intersectionID_to_gps(a);
    const pb = intersectionID_to_gps(b);
    //replace with HAVERSINE
    const ret = Math.sqrt(((pb.x - pa.x) ** 2) + ((pb.y - pa.y) ** 2));
    if(Number.isNaN(ret)) {
      throw new TypeError('no nans!');
    }
    return ret;
  }

  const startGPS = intersectionID_to_gps(start);
  const finishGPS = intersectionID_to_gps(finish);
  const aGPS = intersectionID_to_gps(a);
  const bGPS = intersectionID_to_gps(b);
  const a_to_start = intersectionDistance(a, finish);
  const b_to_start = intersectionDistance(b, finish);

  return b_to_start - a_to_start;
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


  const uColors = new Uint32Array(sbColors);

  uColors.forEach((v, i , a)=> a[i] = 0x00000000);

  const start = [...intersections.keys()][(Math.random() * intersections.size) >>> 0];
  const finish = [...intersections.keys()][(Math.random() * intersections.size) >>> 0];
  uColors[intersections.get(start).location] = 0xFF0000FF;
  uColors[intersections.get(finish).location] = 0xFF00FF00;

  const bestNodes = [start];
  const visitedNodes = new Set();

  //const sortFunction = breadthFirstSort.bind(null, {start, finish, intersections, roads, pointNumbers});
  const sortFunction = closestToFinishFirstSort.bind(null, {start, finish, intersections, roads, pointNumbers});
  
  while(bestNodes.length) {
    await promiseTimeout(1);
    bestNodes.sort(sortFunction);
    const currentIntersection = bestNodes.pop();
    if(currentIntersection === finish) {
      console.log('all done');
      break;
    }
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