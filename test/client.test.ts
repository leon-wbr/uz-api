import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RecaptchaRequiredError, UzApiError, UzClient } from '../src/index.ts';

const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}.json`, import.meta.url), 'utf8');

function fake(routes: Record<string, [number, string]>) {
  const calls: { url: URL; headers: Record<string, string> }[] = [];
  const f = (async (url: URL, init: { headers: Record<string, string> }) => {
    calls.push({ url, headers: init.headers });
    const [status, body] = routes[url.pathname.replace('/api', '')] ?? [404, '{}'];
    return new Response(body, { status });
  }) as unknown as typeof fetch;
  return { client: new UzClient({ fetch: f, minIntervalMs: 0 }), calls };
}

test('trips sends the guest headers and query, parses the fixture', async () => {
  const { client, calls } = fake({ '/v3/trips': [200, fx('trips')] });
  const r = await client.trips({ date: '2026-10-17', fromId: 2218000, toSlug: 'kyiv-pasazhyrskyi' });
  assert.equal(calls[0].url.searchParams.get('date'), '2026-10-17');
  assert.equal(calls[0].url.searchParams.get('with_transfers'), '0');
  assert.equal(calls[0].headers['x-user-agent'], 'UZ/2 Web/1 User/guest');
  assert.match(calls[0].headers['x-session-id'], /^[0-9a-f-]{36}$/);
  assert.ok(r.direct.length > 0);
  const t = r.direct[0];
  assert.equal(typeof t.depart_at, 'number');
  assert.ok(t.train.wagon_classes.every((c) => typeof c.price === 'number' && typeof c.free_seats === 'number'));
});

test('station endpoints', async () => {
  const { client } = fake({
    '/stations': [200, fx('stations')],
    '/stations/suggestions-web': [200, fx('suggestions')],
    '/station-boards': [200, fx('station-boards')],
    '/station-boards/2200001': [200, fx('station-board')],
    '/trips/departure-dates': [200, fx('departure-dates')],
  });
  assert.ok((await client.stations('Львів')).some((s) => s.id === 2218000));
  assert.ok((await client.stationSuggestions()).stations_from.length > 0);
  assert.ok((await client.stationBoards()).length > 0);
  assert.equal((await client.stationBoard(2200001)).station.slug, 'kyiv-pasazhyrskyi');
  assert.match((await client.departureDates(2218000, 2200001))[0], /^\d{4}-\d\d-\d\d$/);
});

test('faq and countries', async () => {
  const { client } = fake({ '/faq': [200, fx('faq')], '/auth/countries': [200, fx('countries')] });
  assert.ok((await client.faq())[0].faqs.length > 0);
  assert.ok((await client.countries()).countries.some((c) => c.name_en === 'Austria'));
});

test('441 surfaces as RecaptchaRequiredError and is never retried', async () => {
  const { client, calls } = fake({ '/station-boards/1': [441, '{"message":"Error","recaptcha_link":"https://example.test/r"}'] });
  await assert.rejects(client.stationBoard(1), (e: unknown) => e instanceof RecaptchaRequiredError && e.link === 'https://example.test/r');
  assert.equal(calls.length, 1);
});

test('other failures raise UzApiError', async () => {
  const { client } = fake({});
  await assert.rejects(client.faq(), UzApiError);
});

test('requests are spaced by minIntervalMs', async () => {
  const f = (async () => new Response('[]')) as unknown as typeof fetch;
  const c = new UzClient({ fetch: f, minIntervalMs: 120 });
  const t0 = Date.now();
  await c.stations(); await c.stations();
  assert.ok(Date.now() - t0 >= 110);
});
