import { useState, useCallback, useEffect } from 'react'
import { ManagedUser } from '../../types'
import { api } from '../../lib/api/client'

export function useUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get<{ users: ManagedUser[] }>('/api/admin/users')
      .then(res => { setUsers(res.users); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return { users, loading, error, refresh: load }
}
