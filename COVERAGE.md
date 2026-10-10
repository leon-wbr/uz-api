# API coverage

Base: `https://app.uz.gov.ua/api`, guest only (no login). Mapped on 2026-10-10 from one recorded browser session plus the site's JS bundles, then one spaced read-only probe per endpoint. Status: **seen** (observed, not typed) · **typed** (types in `src/types.ts`) · **tested** (typed and covered by a test on a recorded fixture).

Required headers: `origin`/`referer` of `booking.uz.gov.ua`, `x-client-locale`, `x-user-agent: UZ/2 Web/1 User/guest`, a client-made UUID in `x-session-id`.

| Endpoint | Method | Params | Response | Plain-HTTP guest | Status |
|---|---|---|---|---|---|
| `/stations` | GET | `search` | `Station[]` | 200 | tested |
| `/stations/suggestions-web` | GET | `search?` | `{ stations_from: Station[] }` | 200 | tested |
| `/station-boards` | GET | – | `Station[]` | 200 | tested |
| `/station-boards/{id}` | GET | – | `{ station, arrivals[] }` | 441 for Lviv (2218000); 200 for Kyiv-Pas (2200001) in the browser | tested (fixture) |
| `/trips/departure-dates` | GET | `station_from_id`, `station_to_id`, `station_to_slug?` | `string[]` (ISO dates) | 200 | tested |
| `/v3/trips` | GET | `date`, `station_from_id`, `station_to_slug`, `with_transfers` | `{ direct: Trip[], with_transfer, monitoring, sale_start }` | **441 (human check)**; works inside a human-verified browser | tested (fixture) |
| `/faq` | GET | – | `FaqGroup[]` | 200 | tested |
| `/auth/countries` | GET | – | `{ countries: Country[] }` | 200 | tested |
| `/home-web` | GET | – | banners and notices (18 KB) | 200 | seen |
| `booking.uz.gov.ua/api/seo-stations` | GET | `from`, `to`, `locale` | tiny, SEO only | – | seen |
| `/v3/trips/{id}` | GET | – | trip detail / wagons (found in bundle) | not probed | seen (bundle) |
| `/faq/{id}` | GET | – | one FAQ article (bundle) | not probed | seen (bundle) |

## Found in the bundle and deliberately not touched

Login and profile (`/v3/auth/send-otp`, `/v3/auth/login`, `/auth/login-token`, `/auth/logout`, `/v2/profile*`, diia/bank-id verification), carts and orders (`/v2/carts/{id}`, `/orders/{id}`, `/profile/orders/{id}/survey`), passengers, payment cards, payment. These need an account or write state, so they are out of scope.

## The human check

Some endpoints answer `441` with a `recaptcha_link` when the caller is not a verified browser. The client raises `RecaptchaRequiredError` and never retries. It does not solve or bypass the check; the main search (`/v3/trips`) is affected, so for real train searches the options are a human-verified browser session of your own or the official app.
