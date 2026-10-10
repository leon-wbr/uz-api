export interface Station { id: number; name: string; slug: string | null; short_name?: string }

export interface StationSuggestions { stations_from: Station[]; [group: string]: Station[] }

export interface BoardEntry { train: string; route: string; time: number; platform: string | null; delay_minutes: number }
export interface StationBoard { station: Station; arrivals: BoardEntry[]; departures?: BoardEntry[] }

export interface WagonClass { id: string; name: string; free_seats: number; price: number; amenities: string[] }
export interface Train { id: number; station_from: string; station_to: string; number: string; type: number; wagon_classes: WagonClass[]; info_popup: unknown }
export interface Trip {
  id: number; depart_at: number; arrive_at: number; station_from: string; station_to: string; stations_time_offset: number;
  train: Train; discount: unknown; custom_tag: unknown; custom_tags: unknown[];
  monitoring: { allowed: boolean; auto_purchase: boolean };
  is_departed: boolean; with_iron_km_program: boolean; max_passengers_count: number; distance: number; seat_hold_enabled: boolean;
}
export interface TripSearch { station_from: string; station_to: string; direct: Trip[]; with_transfer: unknown; monitoring: unknown; sale_start: unknown }

export interface FaqGroup { id: number; title: string; faqs: { id: number; title: string; updated_at: number }[] }
export interface Country { name_uk: string; name_en: string; emoji: string; code: string }
export interface TripsQuery { date: string; fromId: number; toSlug: string; withTransfers?: boolean }
