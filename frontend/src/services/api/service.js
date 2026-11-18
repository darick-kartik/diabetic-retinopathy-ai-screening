import { apiClient, getFileUrl } from './client'

const unavailable = (feature) => {
  throw new Error(`${feature} is unavailable because the current FastAPI backend does not provide that endpoint.`)
}

const normalizeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.full_name,
  role: user.role,
  isActive: user.is_active,
})

const normalizeProfile = (profile, user) => ({
  id: profile.id,
  userId: user.id,
  fullName: user.fullName,
  email: user.email,
  patientCode: profile.patient_code,
  dateOfBirth: profile.date_of_birth || '',
  gender: profile.gender || 'PREFER_NOT_TO_SAY',
})

const normalizePrediction = (prediction, image) => ({
  id: prediction.id,
  imageId: image?.id || prediction.retinal_image_id,
  patientId: image?.patient_id,
  date: prediction.created_at,
  eyeSide: image?.eye_side || 'UNKNOWN',
  grade: prediction.predicted_grade,
  score: prediction.confidence_score,
  probabilities: prediction.class_probabilities,
  status: prediction.status,
  reviewStatus: prediction.review_status,
  modelName: prediction.model_name,
  modelVersion: prediction.model_version,
  imageName: image?.original_filename || 'Retinal image',
  imageSize: image?.file_size_bytes,
  originalImageUrl: image?.id ? getFileUrl(`/images/${image.id}/file`) : null,
  gradcamUrl: prediction.gradcam_path ? getFileUrl(`/predictions/${prediction.id}/gradcam`) : null,
  reviewedGrade: prediction.reviewed_grade,
  reviewNotes: prediction.review_notes,
  reviewedAt: prediction.reviewed_at,
})

const normalizeImage = (image) => ({
  id: image.id,
  imageId: image.id,
  patientId: image.patient_id,
  date: image.created_at,
  eyeSide: image.eye_side,
  grade: null,
  probabilities: null,
  status: image.status,
  reviewStatus: null,
  imageName: image.original_filename,
  imageSize: image.file_size_bytes,
  originalImageUrl: getFileUrl(`/images/${image.id}/file`),
  gradcamUrl: null,
  predictionPending: true,
})

async function fetchAllPages(path, key, signal) {
  const limit = 100
  const first = (await apiClient.get(path, { params: { skip: 0, limit }, signal })).data
  const results = [...(first[key] || [])]
  const pageCount = Math.ceil((first.total || 0) / limit)
  if (pageCount > 1) {
    const pages = await Promise.all(Array.from({ length: pageCount - 1 }, (_, pageIndex) =>
      apiClient.get(path, { params: { skip: (pageIndex + 1) * limit, limit }, signal }),
    ))
    pages.forEach(({ data }) => results.push(...(data[key] || [])))
  }
  return { total: first.total || 0, items: results }
}

async function apiScreenings(signal) {
  const [imageResult, predictionResult] = await Promise.all([
    fetchAllPages('/images/my-images', 'images', signal),
    fetchAllPages('/predictions/my-predictions', 'predictions', signal),
  ])
  const imagesById = new Map(imageResult.items.map((image) => [image.id, image]))
  const predictionsByImageId = new Map()
  const records = predictionResult.items.map((prediction) => {
    predictionsByImageId.set(prediction.retinal_image_id, prediction)
    return normalizePrediction(prediction, imagesById.get(prediction.retinal_image_id))
  })

  imageResult.items
    .filter((image) => !predictionsByImageId.has(image.id))
    .forEach((image) => records.push(normalizeImage(image)))

  records.sort((a, b) => new Date(b.date) - new Date(a.date))
  return { records, imageTotal: imageResult.total, predictionTotal: predictionResult.total }
}

export const apiService = {
  async restoreSession() {
    const { data } = await apiClient.get('/auth/me')
    return normalizeUser(data)
  },

  async login({ email, password }) {
    const { data } = await apiClient.post('/auth/login', { email, password })
    if (!data?.access_token || data.token_type?.toLowerCase() !== 'bearer') {
      throw new Error('The server returned an unsupported authentication response.')
    }
    sessionStorage.setItem('retinacare.api.access-token', data.access_token)
    try {
      const user = await this.restoreSession()
      return { user }
    } catch (error) {
      sessionStorage.removeItem('retinacare.api.access-token')
      throw error
    }
  },

  async register(values) {
    const { data } = await apiClient.post('/auth/register', {
      full_name: values.fullName.trim(),
      email: values.email.trim(),
      password: values.password,
    })
    return normalizeUser(data)
  },

  async getDashboard(user, signal) {
    if (user.role !== 'PATIENT') return unavailable('Doctor and admin dashboards')
    const [profileResponse, screeningResult] = await Promise.all([
      apiClient.get('/patients/me', { signal }),
      apiScreenings(signal),
    ])
    const patient = normalizeProfile(profileResponse.data, user)
    const predictions = screeningResult.records.filter((record) => record.grade !== null)
    return {
      role: 'PATIENT',
      patient,
      totalScreenings: screeningResult.imageTotal,
      lastScreening: screeningResult.records[0] || null,
      recentScreenings: screeningResult.records.slice(0, 5),
      gradeHistory: predictions.slice().reverse(),
    }
  },

  async getProfile(user, signal) {
    if (user.role !== 'PATIENT') return unavailable('This account profile')
    const { data } = await apiClient.get('/patients/me', { signal })
    return normalizeProfile(data, user)
  },

  async updateProfile(user, changes) {
    if (user.role !== 'PATIENT') return unavailable('This account profile update')
    const payload = {}
    if ('dateOfBirth' in changes) payload.date_of_birth = changes.dateOfBirth || null
    if ('gender' in changes) payload.gender = changes.gender || null
    if (!Object.keys(payload).length) throw new Error('There are no supported profile fields to update.')
    const { data } = await apiClient.patch('/patients/me', payload)
    return normalizeProfile(data, user)
  },

  async getScreenings(user, signal) {
    if (user.role !== 'PATIENT') return unavailable('Doctor and admin screening access')
    return (await apiScreenings(signal)).records
  },

  async getScreening(user, screeningId, signal) {
    if (user.role !== 'PATIENT') return unavailable('Doctor screening details')
    const records = (await apiScreenings(signal)).records
    const candidate = records.find(({ id, imageId }) => id === screeningId || imageId === screeningId)
    if (!candidate) throw new Error('Screening record was not found for this account.')
    if (candidate.predictionPending) return candidate
    const { data } = await apiClient.get(`/predictions/${candidate.id}`, { signal })
    const image = records.find(({ imageId }) => imageId === data.retinal_image_id)
    return normalizePrediction(data, image ? {
      id: image.imageId,
      patient_id: image.patientId,
      eye_side: image.eyeSide,
      original_filename: image.imageName,
      file_size_bytes: image.imageSize,
    } : null)
  },

  async uploadImage(user, { file, eyeSide, onProgress, signal }) {
    if (user.role !== 'PATIENT') return unavailable('Patient screening upload')
    const form = new FormData()
    form.append('file', file)
    form.append('eye_side', eyeSide)
    const { data } = await apiClient.post('/images/upload', form, {
      signal,
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
      },
    })
    return normalizeImage(data)
  },

  async createPrediction(user, imageId, signal) {
    if (user.role !== 'PATIENT') return unavailable('Patient prediction')
    const { data: prediction } = await apiClient.post(`/predictions/${imageId}`, null, { signal })
    const images = await apiClient.get('/images/my-images', { params: { skip: 0, limit: 100 }, signal })
    const image = (images.data.images || []).find(({ id }) => id === imageId)
    return normalizePrediction(prediction, image)
  },

  async createScreening(user, values) {
    const image = await this.uploadImage(user, values)
    values.onPhase?.('prediction')
    try {
      const { data: predictionData } = await apiClient.post(`/predictions/${image.imageId}`, null, { signal: values.signal })
      const prediction = normalizePrediction(predictionData, {
        id: image.imageId,
        patient_id: image.patientId,
        eye_side: image.eyeSide,
        original_filename: image.imageName,
        file_size_bytes: image.imageSize,
      })
      values.onPhase?.('gradcam')
      try {
        const { data } = await apiClient.post(`/predictions/${prediction.id}/gradcam`, null, { signal: values.signal })
        return { ...prediction, gradcamUrl: getFileUrl(data.gradcam_url), gradcamStatus: 'AVAILABLE' }
      } catch (gradcamError) {
        return { ...prediction, gradcamStatus: 'NOT_AVAILABLE', gradcamError: gradcamError.message }
      }
    } catch (predictionError) {
      return { ...image, predictionError: predictionError.message }
    }
  },

  async getRecommendations() { return unavailable('Education recommendations') },
  async createRecommendation() { return unavailable('Education recommendations') },
  async getReviews() { return unavailable('Doctor review queue') },
  async saveReview() { return unavailable('Doctor review workflow') },
  async getTreatmentPlans() { return unavailable('Treatment plans and prescriptions') },
  async issueTreatmentPlan() { return unavailable('Treatment plans and prescriptions') },
  async getNotifications() { return unavailable('Notifications') },
  async markNotificationRead() { return unavailable('Notifications') },
  async getReports() { return unavailable('Generated reports') },
  async getAdminOverview() { return unavailable('Admin system overview') },
  async listPatients() { return unavailable('Doctor patient directory') },
  async getAdminUsers() { return unavailable('Admin user management') },
  async updateUserStatus() { return unavailable('Admin user management') },
  async requestPasswordReset() { return unavailable('Password recovery') },
  async resetPassword() { return unavailable('Password recovery') },
  async changePassword() { return unavailable('Password change') },
}
