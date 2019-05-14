'use strict';

function assert(tf) {
  if(!tf) {
    throw new Error('Assertion Failed');
  }
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
  const intersections = new Map(Object.entries(jsonObj.intersections));
  const roads = new Map(Object.entries(jsonObj.roads));
  const points = jsonObj.points;

  const polylines = [...roads.values()].map(road=> `<polyline points="${road.points.map(point=>points[point]).join(' ')}" />`);

  document.querySelector('g.roads').insertAdjacentHTML('beforeEnd', polylines);
}

loadMapFromJSON();

async function loadMap() {
  const kdom = (new DOMParser()).parseFromString((await (await fetch('./Street_Network_Database_SND.kml')).text()), "application/xml");
  console.log(kdom);
  window.kdom = kdom;

  const schema = {};

  const decoders = {
    int(txt) { return parseInt(txt, 10); },
    float(txt) { return parseFloat(txt); },
    string(txt) { return txt; },
    date(txt) { return new Date(txt); },
  };

  for(let SimpleField of kdom.querySelectorAll('Schema>SimpleField')) {
    const name = SimpleField.getAttribute('name');
    const type = SimpleField.getAttribute('type');
    const decoder = decoders[type];
    schema[name] = {name, type, decoder};
  }

  schema.SNDSEG_UPDATE.decoder = decoders.date;

  const allPoints = new Map();
  const pointList = [];
  const intersections = new Map();
  const roads = new Map();

  function getPointID(location) {
    if(!allPoints.has(location)) {
      allPoints.set(location, {
        id: allPoints.size,
      });
      pointList.push(location);
    }
    return allPoints.get(location).id;
  }

  function addIntersection(id, location, node) {
    if(!intersections.has(id)) {
      intersections.set(id, {
        location: location,
        nodes: new Set(),
      });
    }
    intersections.get(id).nodes.add(node);
    assert(intersections.get(id).location === location);
  }

  function decodeSimpleData(Placemark) {
    const properties = {};
    for(let sd of Placemark.querySelectorAll('SimpleData')) {
      const name = sd.getAttribute('name');
      properties[name] = schema[name].decoder(sd.textContent);
    }
    return properties;
  }

  for(let Placemark of kdom.querySelectorAll('Placemark')) {
    const properties = decodeSimpleData(Placemark);

    const {OBJECTID, F_INTR_ID, T_INTR_ID} = properties;
    const coordinates = Placemark.querySelector('coordinates');
    const points = coordinates.textContent.split(/\s+/g).map(getPointID);
    const pointFrom = points[0];
    const pointTo = points[points.length - 1];

    roads.set(OBJECTID, {...properties, points});

    addIntersection(F_INTR_ID, pointFrom, OBJECTID);
    addIntersection(T_INTR_ID, pointTo, OBJECTID);

  }
  // <polyline points="100,100 150,25 150,75 200,0" />

  // const pointBuffer = new Float32Array([...allPoints.keys()].flatMap(v=> v.split(',').map(parseFloat)));
  // console.log(pointBuffer);

  const lines = [...roads.values()].map(road=> {
    let {points} = road;
    let gpsPoints = points.map(point=>pointList[point]);
    return `<polyline points="${gpsPoints.join(' ')}" />`;
  });

  document.querySelector('g.roads').insertAdjacentHTML('beforeEnd', lines);
  console.log({intersections, roads, allPoints, pointList});

  const jsonObj = {
    intersections: Object.fromEntries([...intersections.entries()].map(([key, value])=> [key, {location: value.location, nodes: [...value.nodes.values()]}])),
    pointList,
    roads: Object.fromEntries([...roads.entries()].map(([key, value])=> [key, value])),
  };
  console.log(JSON.stringify(jsonObj.intersections));
  console.log(JSON.stringify(jsonObj.pointList));
  console.log(JSON.stringify(jsonObj.roads));
}

//loadMap();