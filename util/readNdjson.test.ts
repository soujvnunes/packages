import { describe, expect, it } from 'vitest'
import { readNdjson } from './readNdjson'
const streamOf = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
const collect = async <T>(stream: ReadableStream<Uint8Array>) => {
  const values: T[] = []
  for await (const value of readNdjson<T>(stream)) values.push(value)
  return values
}
describe('readNdjson', () => {
  it('yields one value per newline-terminated line', async () => {
    const stream = streamOf('{"n":1}\n{"n":2}\n{"n":3}\n')
    await expect(collect(stream)).resolves.toEqual([{ n: 1 }, { n: 2 }, { n: 3 }])
  })
  it('buffers a line split across chunks until its newline arrives', async () => {
    const stream = streamOf('{"n":', '1}\n{"n"', ':2}\n')
    await expect(collect(stream)).resolves.toEqual([{ n: 1 }, { n: 2 }])
  })
  it('yields a final line that never got its newline', async () => {
    const stream = streamOf('{"n":1}\n{"n":2}')
    await expect(collect(stream)).resolves.toEqual([{ n: 1 }, { n: 2 }])
  })
  it('skips blank lines, so a trailing newline yields nothing extra', async () => {
    const stream = streamOf('{"n":1}\n\n\n{"n":2}\n')
    await expect(collect(stream)).resolves.toEqual([{ n: 1 }, { n: 2 }])
  })
  it('yields nothing for an empty stream', async () => {
    await expect(collect(streamOf())).resolves.toEqual([])
    await expect(collect(streamOf('\n'))).resolves.toEqual([])
  })
  it('decodes a multi-byte character split across chunks', async () => {
    const encoded = new TextEncoder().encode('{"n":"é"}\n')
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded.slice(0, 7))
        controller.enqueue(encoded.slice(7))
        controller.close()
      },
    })
    await expect(collect(stream)).resolves.toEqual([{ n: 'é' }])
  })
  it('yields each value as it arrives rather than buffering the whole stream', async () => {
    let released: () => void = () => {}
    const secondChunk = new Promise<void>((resolve) => {
      released = resolve
    })
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode('{"n":1}\n'))
        await secondChunk
        controller.enqueue(encoder.encode('{"n":2}\n'))
        controller.close()
      },
    })
    const iterator = readNdjson<{ n: number }>(stream)
    await expect(iterator.next()).resolves.toEqual({ value: { n: 1 }, done: false })
    released()
    await expect(iterator.next()).resolves.toEqual({ value: { n: 2 }, done: false })
  })
  it('rejects on a malformed line rather than skipping it', async () => {
    await expect(collect(streamOf('{"n":1}\nnot json\n'))).rejects.toThrow(SyntaxError)
  })
})
