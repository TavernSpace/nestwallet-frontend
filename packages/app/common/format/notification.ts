export function formatNotificationCount(count: number, digits = 3) {
  if (count.toString().length >= digits) {
    return `${'9'.repeat(digits - 1)}+`;
  } else {
    return count.toString();
  }
}
