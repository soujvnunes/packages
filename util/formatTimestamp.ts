export const formatTimestamp = (value: Date | string, lang: string) =>
  new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    // `hourCycle: 'h23'` and not `hour12: false`, which resolves to the h24 cycle in en-US and renders midnight as 24:05.
    hourCycle: 'h23',
  }).format(new Date(value))
