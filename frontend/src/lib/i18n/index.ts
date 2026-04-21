import en from '../../../../messages/en.json'

function get(obj: unknown, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : path
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function t(key: string): string {
  return get(en, key)
}
