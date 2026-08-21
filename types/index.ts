export interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN'
  bio: string | null
  avatarUrl: string | null
  location: string | null
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  title: string
  slug: string
  description: string
  price: number
  deliveryTimeDays: number
  imageUrl: string | null
  ratingAvg: number
  totalReviews: number
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  providerId: string
  provider: {
    name: string | null
    avatarUrl: string | null
    ratingAvg: number
    totalReviews: number
  }
  category: {
    name: string
    slug: string
    icon: string | null
  }
  createdAt: string
}

export interface Order {
  id: string
  totalPrice: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  orderNotes: string | null
  deadline: string | null
  createdAt: string
  customerId: string
  serviceId: string
  service: Service
}

export interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  reviewer: User
}