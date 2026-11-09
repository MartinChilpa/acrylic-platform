// Shared formatters. Building an Intl.NumberFormat is expensive, and these run
// from templates on every change-detection pass, so each one is created once.

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const USD_CENTS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const INTEGER = new Intl.NumberFormat('en-US');

/** $1,500 */
export function formatUsd(amount: number): string {
  return USD.format(amount);
}

/** $1,500.00 */
export function formatUsdCents(amount: number): string {
  return USD_CENTS.format(amount);
}

/** 1,234,567 */
export function formatInteger(value: number): string {
  return INTEGER.format(value);
}
