# uz-api

> **Built with Claude and Codex.** Reverse-engineered, unofficial and AI-written: expect gaps and breaking changes.

Unofficial, typed TypeScript client for the **guest (no-login), read-only** endpoints behind [booking.uz.gov.ua](https://booking.uz.gov.ua) (Ukrzaliznytsia). Zero runtime dependencies; uses the global `fetch`. Not affiliated with or endorsed by Ukrzaliznytsia.

The built library runs on Node 20 or later. The tests run raw `.ts` files, so they need Node 22.18 or later.

## Install

Not on npm yet. Clone the repo and build it:

```sh
git clone https://github.com/leon-wbr/uz-api.git
cd uz-api
npm i
npm run build
```

The build writes the library to `dist/`.

## Usage

`trips()` currently throws `RecaptchaRequiredError` (HTTP 441) from non-browser clients. The station and date calls work.

```ts
import { UzClient, RecaptchaRequiredError } from 'uz-api';

const uz = new UzClient();                        // 2 s minimum gap between calls
const [lviv] = await uz.stations('Львів');
// 2200001 is the station id of Kyiv-Pasazhyrskyi
console.log(await uz.departureDates(lviv.id, 2200001, 'kyiv-pasazhyrskyi'));

try {
  const r = await uz.trips({ date: '2026-10-17', fromId: lviv.id, toSlug: 'kyiv-pasazhyrskyi' });
  for (const t of r.direct) console.log(t.train.number, new Date(t.depart_at * 1000), t.train.wagon_classes.map((c) => `${c.name} ${c.free_seats} @ ${c.price / 100}₴`));
} catch (e) {
  if (e instanceof RecaptchaRequiredError) console.log('UZ wants a human check for this call');
}
```

Prices are in kopecks; timestamps are Unix seconds.

The client waits at least 2 seconds between calls by default. Change it with the `minIntervalMs` option, for example `new UzClient({ minIntervalMs: 5000 })`. The other options are `locale` (`'uk'` or `'en'`, default `'uk'`) and `baseUrl`. See [COVERAGE.md](COVERAGE.md) for the other methods and endpoints.

## Limits, on purpose

- **Read-only, guest-only.** No login, booking, payment or ticket calls, and none are planned.
- **No bot-check bypass.** `/v3/trips` and some other calls answer HTTP 441 with a recaptcha link to non-browser clients. The client throws `RecaptchaRequiredError` and does not retry or solve it. See [COVERAGE.md](COVERAGE.md) for what works.
- **Be gentle.** The client enforces a minimum interval between calls; don't poll faster than every few minutes.
- Undocumented API, so it can change or disappear. Check the terms of use before relying on it.

## Develop

```sh
npm i
npm test          # node:test on recorded fixtures (Node ≥ 22.18); `npm run build` emits `dist/`
npm run typecheck
```

## Contributing

Bugs and ideas go to [GitHub Issues](https://github.com/leon-wbr/uz-api/issues). Fixtures in `test/fixtures` are public, unauthenticated responses. They must stay free of personal data.

## License

MIT, see [LICENSE](LICENSE).
