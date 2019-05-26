'use strict';

async function promiseTimeout(msec) {
  return new Promise((resolve)=> setTimeout(resolve, msec));
}

/*
Should really refactor into a CLASS
*/

function breadthFirstSort({perNodeInfo, start, finish, intersections, roads, pointNumbers}, a, b) {
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

function closestToFinishFirstSort({perNodeInfo, start, finish, intersections, roads, pointNumbers}, a, b) {
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
  const a_to_finish = intersectionDistance(a, finish);
  const b_to_finish = intersectionDistance(b, finish);

  return b_to_finish - a_to_finish;
}

function AStarSort({perNodeInfo, start, finish, intersections, roads, pointNumbers}, a, b) {
  //cost so far (accurate) + estimated cost remaining (must be underestimated)

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
  const a_to_finish = intersectionDistance(a, finish);
  const b_to_finish = intersectionDistance(b, finish);
  const a_cost_so_far = perNodeInfo.get(a).cost_so_far;
  const b_cost_so_far = perNodeInfo.get(b).cost_so_far;

  return (b_to_finish + b_cost_so_far) - (a_to_finish + a_cost_so_far);
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

  uColors.forEach((v, i , a)=> a[i] = 0x40FFFFFF);

  const start = [...intersections.keys()][(Math.random() * intersections.size) >>> 0];
  const finish = [...intersections.keys()][(Math.random() * intersections.size) >>> 0];
  uColors[intersections.get(start).location] = 0xFF0000FF; //turn it red
  uColors[intersections.get(finish).location] = 0xFF00FF00; //turn it greem

  const bestNodes = [start];
  const visitedNodes = new Set();

  const perNodeInfo = new Map();
  //const sortFunction = breadthFirstSort.bind(null, {start, finish, intersections, roads, pointNumbers, perNodeInfo});
  //const sortFunction = closestToFinishFirstSort.bind(null, {start, finish, intersections, roads, pointNumbers, perNodeInfo});
  const sortFunction = AStarSort.bind(null, {start, finish, intersections, roads, pointNumbers, perNodeInfo});
  
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

  perNodeInfo.set(start, {
    cost_so_far: 0,
  });

  while(bestNodes.length) {
    await promiseTimeout(10);
    bestNodes.sort(sortFunction); // replace with a Binary Tree of some kind
    const currentIntersection = bestNodes.pop();
    if(currentIntersection === finish) {
      console.log('all done');
      break;
    }
    visitedNodes.add(currentIntersection);
    const newIntersections = new Map();
    for(let node of intersections.get(currentIntersection).nodes) {
      const road = roads.get(node);
      //console.log(road);
      newIntersections.set(road.F_INTR_ID, {roadLength: intersectionDistance(road.F_INTR_ID, road.T_INTR_ID)});
      newIntersections.set(road.T_INTR_ID, {roadLength: intersectionDistance(road.F_INTR_ID, road.T_INTR_ID)});
    }

    for(let [node, {roadLength}] of newIntersections.entries()) {
      if(visitedNodes.has(node)) {
        continue;
      }
      //FIXME COLOR ALL ROAD SEGMENTS
      uColors[intersections.get(node).location] = 0xFFFF0000; //turn it blue
      perNodeInfo.set(node, {
        cost_so_far: perNodeInfo.get(currentIntersection).cost_so_far + roadLength,
      });
      bestNodes.push(node);
    }
    //console.log(perNodeInfo);
  }
};