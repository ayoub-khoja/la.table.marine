import { parseISO, format, isValid } from 'date-fns'

export default function Date({ dateString }) {
  if (!dateString) return null;
  const date = parseISO(dateString);
  if (!isValid(date)) return <time dateTime={dateString}>{dateString}</time>;
  return <time dateTime={dateString}>{format(date, 'dd.MM.yyyy')}</time>
}