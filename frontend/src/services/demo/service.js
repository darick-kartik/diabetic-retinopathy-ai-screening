export const DEMO_CREDENTIALS = {
  email: 'demo@retinacare.local',
  password: 'RetinaCareDemo!2026',
}

export const DEMO_USER = {
  id: 'demo-patient-account',
  email: DEMO_CREDENTIALS.email,
  fullName: 'Demo Patient',
  role: 'PATIENT',
  isActive: true,
  isDemo: true,
}

const profile = {
  id: 'demo-patient-profile',
  userId: DEMO_USER.id,
  fullName: DEMO_USER.fullName,
  email: DEMO_USER.email,
  patientCode: 'DEMO-0001',
  dateOfBirth: '1985-01-01',
  gender: 'PREFER_NOT_TO_SAY',
}

const records = [
  { id: 'DEMO-SCREENING-003', imageId: 'DEMO-IMAGE-003', patientId: profile.id, date: '2025-03-18T10:30:00Z', eyeSide: 'LEFT', grade: 1, score: 0.78, probabilities: { '0': 0.12, '1': 0.78, '2': 0.07, '3': 0.02, '4': 0.01 }, status: 'COMPLETED', reviewStatus: null, modelName: 'DEMO DATA - NOT AI', modelVersion: 'synthetic', imageName: 'demo-left-screening.jpg', imageSize: null, originalImageUrl: null, gradcamUrl: null },
  { id: 'DEMO-SCREENING-002', imageId: 'DEMO-IMAGE-002', patientId: profile.id, date: '2024-11-06T10:30:00Z', eyeSide: 'LEFT', grade: 0, score: 0.84, probabilities: { '0': 0.84, '1': 0.11, '2': 0.03, '3': 0.01, '4': 0.01 }, status: 'COMPLETED', reviewStatus: null, modelName: 'DEMO DATA - NOT AI', modelVersion: 'synthetic', imageName: 'demo-left-screening.jpg', imageSize: null, originalImageUrl: null, gradcamUrl: null },
  { id: 'DEMO-SCREENING-001', imageId: 'DEMO-IMAGE-001', patientId: profile.id, date: '2024-04-22T10:30:00Z', eyeSide: 'LEFT', grade: 0, score: 0.91, probabilities: { '0': 0.91, '1': 0.06, '2': 0.02, '3': 0.005, '4': 0.005 }, status: 'COMPLETED', reviewStatus: null, modelName: 'DEMO DATA - NOT AI', modelVersion: 'synthetic', imageName: 'demo-left-screening.jpg', imageSize: null, originalImageUrl: null, gradcamUrl: null },
]

export const demoService = {
  async login(credentials) {
    if (credentials.email.trim().toLowerCase() !== DEMO_CREDENTIALS.email || credentials.password !== DEMO_CREDENTIALS.password) {
      throw new Error('Demo sign-in failed. Check the demo email and password shown on this page.')
    }
    return { user: DEMO_USER, isDemo: true }
  },

  async getDashboard() {
    return { role: 'PATIENT', patient: { ...profile }, totalScreenings: records.length, lastScreening: records[0], recentScreenings: records, gradeHistory: [...records].reverse() }
  },

  async getScreenings() { return records },

  async getScreening(_user, screeningId) {
    const record = records.find(({ id, imageId }) => id === screeningId || imageId === screeningId)
    if (!record) throw new Error('Demo screening record was not found.')
    return record
  },

  async getProfile() { return { ...profile } },

  async updateProfile(_user, changes) { return { ...profile, ...changes } },

  async createPrediction() {
    throw new Error('Model inference is disabled in demo mode. Connect the FastAPI backend to run a real prediction.')
  },

  async createScreening() {
    throw new Error('Image upload and AI inference are disabled in demo mode. Connect the FastAPI backend to use these features.')
  },
}
