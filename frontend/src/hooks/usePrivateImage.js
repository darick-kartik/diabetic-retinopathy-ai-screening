import { useEffect, useState } from 'react'
import { apiClient } from '@/services/api/client'

export function usePrivateImage(url) {
  const [source, setSource] = useState(null)
  useEffect(() => {
    if (!url) { setSource(null); return undefined }
    setSource(null)
    let objectUrl
    let active = true
    const controller = new AbortController()
    apiClient.get(url, { responseType: 'blob', signal: controller.signal }).then(({ data }) => {
      objectUrl = URL.createObjectURL(data)
      if (active) setSource(objectUrl)
    }).catch(() => { if (active) setSource(null) })
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [url])
  return source
}
