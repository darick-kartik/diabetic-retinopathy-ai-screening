import { apiService } from './api/service'
import { DEMO_CREDENTIALS, demoService } from './demo/service'

export const service = new Proxy(apiService, {
  get(target, property, receiver) {
    if (property === 'login') {
      return async (credentials) => {
        if (credentials.email.trim().toLowerCase() === DEMO_CREDENTIALS.email && credentials.password === DEMO_CREDENTIALS.password) {
          return demoService.login(credentials)
        }
        return target.login(credentials)
      }
    }

    const apiMethod = Reflect.get(target, property, receiver)
    if (typeof apiMethod !== 'function') return apiMethod

    return (...args) => {
      const [user] = args
      const demoMethod = demoService[property]
      if (user?.isDemo && typeof demoMethod === 'function') return demoMethod(...args)
      return apiMethod.apply(target, args)
    }
  },
})
