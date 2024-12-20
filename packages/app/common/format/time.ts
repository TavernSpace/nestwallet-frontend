import { DateTime } from 'luxon';

export const formatDate = (date: string): string => {
  return DateTime.fromISO(date).toFormat('LLL d, yyyy');
};

export const formatRelativeTimeUntil = (
  date: string | null | undefined,
): string => {
  if (date) {
    const now = DateTime.now();

    const target = DateTime.fromISO(date);
    const diff = target.diff(now, ['days', 'hours', 'minutes']);

    if (diff.as('seconds') <= 0) {
      return '0d 0h 0m';
    }

    const days = diff.days;
    const hours = diff.hours;
    const minutes = diff.minutes;

    return `${Math.floor(days)}d ${Math.floor(hours)}h ${Math.floor(minutes)}m`;
  }
  return '';
};
