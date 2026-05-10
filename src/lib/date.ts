export function toLocalISODate(value: Date): string {
  // YYYY-MM-DD in the user's local timezone (avoids UTC day shift from toISOString()).
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

export function todayLocalISODate(): string {
  return toLocalISODate(new Date());
}

