export interface Link {
  id: string
  title: string
  description: string
  href: string
  category: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface User {
  email: string
  name: string
  role: 'admin' | 'user'
  status?: 'pending' | 'approved' | 'rejected'
  auth_provider?: string
  mustChangePassword?: boolean
}

export interface ManagedUser {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'user'
  status: 'pending' | 'approved' | 'rejected'
  auth_provider: 'local' | 'microsoft'
  created_at: string
  updated_at: string
  approved_at: string | null
  approved_by: string | null
  last_login_at: string | null
}
