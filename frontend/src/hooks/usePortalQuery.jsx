import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { service } from '@/services'

export function usePortalQuery(key, callback, options = {}) {
  const { user } = useAuth()
  return useQuery({ queryKey: [key, user?.id], queryFn: ({ signal }) => callback(user, signal), enabled: Boolean(user), ...options })
}
