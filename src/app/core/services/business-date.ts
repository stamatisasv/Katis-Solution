export function businessDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function athensDateTime(value: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}
// Accept only real local times. Reject skipped/repeated hours at DST transitions.
export function athensDateTimeToIso(value: string): string {
  const candidates = ['+02:00', '+03:00']
    .map((offset) => new Date(value + ':00' + offset))
    .filter(
      (date) => Number.isFinite(date.getTime()) && athensDateTime(date.toISOString()) === value,
    );
  if (candidates.length !== 1)
    throw new Error(
      'Η ώρα δεν είναι έγκυρη ή είναι διπλή λόγω αλλαγής θερινής ώρας. Επιλέξτε άλλη ώρα.',
    );
  return candidates[0].toISOString();
}
