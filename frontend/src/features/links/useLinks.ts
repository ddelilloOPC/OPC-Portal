import { useState, useEffect } from 'react'
import { Link } from '../../types'
import { api } from '../../lib/api/client'

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLinks = () => {
    setLoading(true)
    api.get<{ links: Link[] }>('/api/links')
      .then((data) => setLinks(data.links))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLinks() }, [])

  return { links, loading, error, refresh: fetchLinks }
}
