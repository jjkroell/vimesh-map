// Gets all samples, coverage, and repeaters for the map.
// Lots of data to send back, so fields are minimized.
import * as util from '../content/shared.js';

export async function onRequest(context) {
  const coverageStore = context.env.COVERAGE;
  const sampleStore = context.env.SAMPLES;
  const repeaterStore = context.env.REPEATERS;
  const responseData = {
    coverage: [],
    samples: [],
    repeaters: []
  };

  let cursor = null;
  do {
    const coverageList = await coverageStore.list({ cursor: cursor });
    cursor = coverageList.cursor ?? null;
    coverageList.keys.forEach(c => {
      // Old coverage items only have "lastHeard".
      const lastHeardTime = c.metadata.heard ? c.metadata.lastHeard : 0;
      const updatedTime = c.metadata.updated ?? c.metadata.lastHeard;

      const item = {
        id: c.name,
        rcv: c.metadata.heard ?? 0,
        lost: c.metadata.lost ?? 0,
        ut: util.truncateTime(updatedTime),
        lht: util.truncateTime(lastHeardTime),
      };

      // Don't send empty lists.
      const repeaters = c.metadata.hitRepeaters ?? [];
      if (repeaters.length > 0) {
        item.rptr = repeaters
      };

      responseData.coverage.push(item);
    });
  } while (cursor !== null)

  // TODO: merge samples into coverage server-side?
  do {
    const samplesList = await sampleStore.list({ cursor: cursor });
    cursor = samplesList.cursor ?? null;
    samplesList.keys.forEach(s => {
      const item = {
        id: s.name,
        time: util.truncateTime(s.metadata.time ?? 0),
      };

      // Don't send empty lists.
      const path = s.metadata.path ?? [];
      if (path.length > 0) {
        item.path = path
      };

      responseData.samples.push(item);
    });
  } while (cursor !== null)

  do {
    const repeatersList = await repeaterStore.list({ cursor: cursor });
    repeatersList.keys.forEach(r => {
      responseData.repeaters.push({
        time: util.truncateTime(r.metadata.time ?? 0),
        id: r.metadata.id,
        name: r.metadata.name,
        lat: r.metadata.lat,
        lon: r.metadata.lon,
        elev: Math.round(r.metadata.elev ?? 0),
      });
    });
  } while (cursor !== null)

  return new Response(JSON.stringify(responseData));
}
