// Reads a newline-delimited-JSON HTTP body as an async stream of typed values. Each `\n`-terminated line is one JSON object; a partial trailing line is buffered until its newline arrives, and any final unterminated line is yielded on close. Used client-side to consume a progress stream one event at a time.
export const readNdjson = async function* <T>(body: ReadableStream<Uint8Array>): AsyncGenerator<T> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let newline = buffer.indexOf('\n')

    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim()

      buffer = buffer.slice(newline + 1)

      if (line) yield JSON.parse(line) as T

      newline = buffer.indexOf('\n')
    }
  }

  const last = buffer.trim()

  if (last) yield JSON.parse(last) as T
}
