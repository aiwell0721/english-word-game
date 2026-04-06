import React, { useEffect } from 'react'
import { UserProvider, useUser } from './components/User/UserProvider'
import { ParentProvider } from './components/ParentProvider'
import LoginPage from './components/User/LoginPage'
import ParentLogin from './components/Parent/ParentLogin'
import Dashboard from './components/User/Dashboard'
import ParentDashboard from './components/Parent/ParentDashboard'
import './App.css'

const AppContent: React.FC = () => {
  const { user } = useUser()
  const [currentView, setCurrentView] = React.useState<'user' | 'parent'>('user')

  useEffect(() => {
    const path = window.location.pathname
    const parentToken = localStorage.getItem('parentToken')
    
    if (path === '/parent' || path === '/parent/dashboard') {
      setCurrentView('parent')
    } else if (parentToken) {
      setCurrentView('parent')
    }
  }, [])

  const handleSwitchToParent = () => {
    setCurrentView('parent')
    window.history.pushState({}, '', '/parent')
  }

  const handleSwitchToUser = () => {
    setCurrentView('user')
    window.history.pushState({}, '', '/')
  }

  if (currentView === 'parent') {
    const parentToken = localStorage.getItem('parentToken')
    const parentInfo = localStorage.getItem('parentInfo')
    
    if (!parentToken) {
      return (
        <div className="app">
          <div className="view-switcher">
            <button 
              className="switch-btn active" 
              onClick={handleSwitchToParent}
            >
              👨 家长
            </button>
            <button 
              className="switch-btn" 
              onClick={handleSwitchToUser}
            >
              👦 学生
            </button>
          </div>
          <ParentLogin />
        </div>
      )
    }
    
    return (
      <div className="app">
        <ParentDashboard />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="view-switcher">
        <button 
          className="switch-btn active" 
          onClick={handleSwitchToUser}
        >
          👦 学生
        </button>
        <button 
          className="switch-btn" 
          onClick={handleSwitchToParent}
        >
          👨 家长
        </button>
      </div>
      {!user ? (
        <LoginPage onRegisterClick={() => {}} />
      ) : (
        <Dashboard />
      )}
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <ParentProvider>
        <AppContent />
      </ParentProvider>
    </UserProvider>
  )
}

export default App
