import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import ProjectDetail from './pages/ProjectDetail'
import Navbar from './components/Navbar'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function HomePage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.role === 'enseignant' ? <TeacherDashboard /> : <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Navbar />
            <HomePage />
          </PrivateRoute>
        } />
        <Route path="/projects/:id" element={
          <PrivateRoute>
            <Navbar />
            <ProjectDetail />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
