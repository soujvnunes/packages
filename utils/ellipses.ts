export const ellipses = (string: string, count: number = 3) => {
  if (string.length < count * 2 + 3) throw Error('Unnecessary usage of ellipses utility.')

  return `${string.substring(0, count)}...${string.substring(string.length - count)}`
}
