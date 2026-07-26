export const formatTimestamp = (value: Date | string, lang: string) =>
  new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
