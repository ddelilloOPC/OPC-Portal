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
}
