export async function onRequest(context) {
  const store = context.env.SAMPLES;
  const url = new URL(context.request.url);
  const prefix = url.searchParams.get('p');
  const results = [];
  let cursor = null;

  do {
    const samples = await store.list({ prefix: prefix, cursor: cursor });
    cursor = samples.cursor ?? null;
    samples.keys.forEach(s => {
      results.push({
        hash: s.name,
        time: s.metadata.time,
        path: s.metadata.path ?? [],
      });
    });
  } while (cursor !== null)

  return new Response(JSON.stringify(results));
}
