import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If 401, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ────────────────────────────────────────────────────────────────────
export const register = (data)      => api.post('/auth/register', data)
export const login    = (data)      => api.post('/auth/login', data)
export const getMe    = ()          => api.get('/auth/me')
export const getUsers = ()          => api.get('/auth/users')

// ── Projects ────────────────────────────────────────────────────────────────
export const getProjects    = ()            => api.get('/projects')
export const getProject     = (id)          => api.get(`/projects/${id}`)
export const createProject  = (data)        => api.post('/projects', data)
export const getMembers     = (id)          => api.get(`/projects/${id}/members`)
export const addMember      = (id, userId)  => api.post(`/projects/${id}/members`, { user_id: userId })
export const getDashboardStats = ()         => api.get('/projects/dashboard/stats')
export const exportPdf      = (id)          => api.get(`/projects/${id}/report/pdf`, { responseType: 'blob' })

// ── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks     = (projectId)        => api.get(`/tasks/project/${projectId}`)
export const createTask   = (data)             => api.post('/tasks', data)
export const updateTask   = (taskId, data)     => api.patch(`/tasks/${taskId}`, data)
export const deleteTask   = (taskId)           => api.delete(`/tasks/${taskId}`)

// ── Messages ────────────────────────────────────────────────────────────────
export const getMessages  = (projectId)        => api.get(`/messages/project/${projectId}`)
export const sendMessage  = (projectId, data)  => api.post(`/messages/project/${projectId}`, data)

// ── Notifications ───────────────────────────────────────────────────────────
export const getNotifications = ()             => api.get('/notifications')
export const markNotificationRead = (id)       => api.patch(`/notifications/${id}/read`)
export const markAllNotificationsRead = ()     => api.patch('/notifications/read-all')

export default api
