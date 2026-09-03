/**
 * PreClear Price rules.
 *
 * A track is on the "PreClear Price" tier when `catalog_price.price_temp` is 1500
 * or `catalog_track.price_id` is 2. Both arrive on the track payload as
 * `price_temp` / `price_id`.
 *
 * The tier also needs a price to show — the whole flow renders the amount
 * ("$1,500", "License for $1,500", "Pay listed price…"). A track that matches the
 * rule but has no usable price (`price_temp` 0 or null and no other price on the
 * payload) stays on the Artist Promo copy it has today.
 */

export const PRECLEAR_PRICE_ID = 2;
export const PRECLEAR_PRICE_TEMP = 1500;

export interface PreClearPriceInput {
  priceId?: unknown;
  priceTemp?: unknown;
  fallbackPrice?: unknown;
}

/** A price is usable only when it is a finite number above zero. */
function toPriceAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function formatTierPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function resolvePreClearPrice(input: PreClearPriceInput): number | null {
  return toPriceAmount(input.priceTemp) ?? toPriceAmount(input.fallbackPrice);
}

export function isPreClearPrice(input: PreClearPriceInput): boolean {
  const matchesPriceTemp = Number(input.priceTemp) === PRECLEAR_PRICE_TEMP;
  const matchesPriceId = Number(input.priceId) === PRECLEAR_PRICE_ID;
  if (!matchesPriceTemp && !matchesPriceId) {
    return false;
  }
  return resolvePreClearPrice(input) !== null;
}

export function readTrackPreClearInput(track: any): PreClearPriceInput {
  return {
    priceId: track?.price_id,
    priceTemp: track?.price_temp,
    fallbackPrice: track?.price ?? track?.license_price ?? track?.price_amount
  };
}

export function isPreClearTrack(track: any): boolean {
  return isPreClearPrice(readTrackPreClearInput(track));
}

export function getPreClearTrackPrice(track: any): number | null {
  return resolvePreClearPrice(readTrackPreClearInput(track));
}
