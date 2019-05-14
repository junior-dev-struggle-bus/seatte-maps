'use strict';

function assert(tf) {
  if(!tf) {
    throw new Error('Assertion Failed');
  }
}

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
  const intersections = new Map();
  const roads = new Map();

  function getPointID(location) {
    if(!allPoints.has(location)) {
      allPoints.set(location, {
        id: allPoints.size,
      });
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
    roads.set(OBJECTID, properties);

    const coordinates = Placemark.querySelector('coordinates');
    const points = coordinates.textContent.split(/\s+/g).map(getPointID);
    const pointFrom = points[0];
    const pointTo = points[points.length - 1];
    
    addIntersection(F_INTR_ID, pointFrom, OBJECTID);
    addIntersection(T_INTR_ID, pointTo, OBJECTID);

  }
  console.log({intersections, roads, allPoints});
  // const pointBuffer = new Float32Array([...allPoints.keys()].flatMap(v=> v.split(',').map(parseFloat)));
  // console.log(pointBuffer);
}

loadMap();