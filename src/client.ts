import type { Country, FaqGroup, Station, StationBoard, StationSuggestions, TripSearch, TripsQuery } from './types.ts';

export class RecaptchaRequiredError extends Error {
  readonly path: string;
  readonly link: string | undefined;
  constructor(path: string, link: string | undefined) {
    super(`UZ answered 441 for ${path}: a human check is required. This client does not solve it.`);
    this.path = path;
    this.link = link;
  }
}
export class UzApiError extends Error {
  readonly status: number;
  readonly path: string;
  constructor(status: number, path: string) {
    super(`UZ API ${status} for ${path}`);
    this.status = status;
    this.path = path;
  }
}

export interface UzClientOptions {
  fetch?: typeof fetch;
  baseUrl?: string;
  locale?: 'uk' | 'en';
  minIntervalMs?: number;
}

export class UzClient {
  private readonly f: typeof fetch;
  private readonly base: string;
  private readonly locale: string;
  private readonly gap: number;
  private readonly sessionId = crypto.randomUUID();
  private last = 0;

  constructor(o: UzClientOptions = {}) {
    this.f = o.fetch ?? fetch;
    this.base = o.baseUrl ?? 'https://app.uz.gov.ua/api';
    this.locale = o.locale ?? 'uk';
    this.gap = o.minIntervalMs ?? 2000;
  }

  private async get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const wait = this.last + this.gap - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.last = Date.now();
    const url = new URL(this.base + path);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));
    const res = await this.f(url, {
      headers: {
        accept: 'application/json',
        origin: 'https://booking.uz.gov.ua',
        referer: 'https://booking.uz.gov.ua/',
        'x-client-locale': this.locale,
        'x-session-id': this.sessionId,
        'x-user-agent': 'UZ/2 Web/1 User/guest',
      },
    });
    if (res.status === 441) {
      const body = (await res.json().catch(() => ({}))) as { recaptcha_link?: string };
      throw new RecaptchaRequiredError(path, body.recaptcha_link);
    }
    if (!res.ok) throw new UzApiError(res.status, path);
    return (await res.json()) as T;
  }

  stations(search = ''): Promise<Station[]> { return this.get('/stations', { search }); }
  stationSuggestions(search?: string): Promise<StationSuggestions> { return this.get('/stations/suggestions-web', { search }); }
  stationBoards(): Promise<Station[]> { return this.get('/station-boards'); }
  stationBoard(stationId: number): Promise<StationBoard> { return this.get(`/station-boards/${stationId}`); }
  departureDates(fromId: number, toId: number, toSlug?: string): Promise<string[]> {
    return this.get('/trips/departure-dates', { station_from_id: fromId, station_to_id: toId, station_to_slug: toSlug });
  }
  trips(q: TripsQuery): Promise<TripSearch> {
    return this.get('/v3/trips', { with_transfers: q.withTransfers ? 1 : 0, date: q.date, station_from_id: q.fromId, station_to_slug: q.toSlug });
  }
  faq(): Promise<FaqGroup[]> { return this.get('/faq'); }
  countries(): Promise<{ countries: Country[] }> { return this.get('/auth/countries'); }
}
