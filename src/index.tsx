import SqliteWindows from './NativeSqliteWindows';

export function multiply(a: number, b: number): number {
  return SqliteWindows.multiply(a, b);
}
