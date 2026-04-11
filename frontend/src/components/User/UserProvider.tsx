import React, { useState, createContext, useContext } from 'react'
import type { User } from '../types'

// 用户上下文
interface UserContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  register: (username: string, password: string, grade_level: number) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // 注册
  const register = async (username: string, password: string, grade_level: number) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          grade_level
        }),
      })

      const data = await response.json()
      if (data.success) {
        // 注册成功后自动登录
        const loginResponse = await fetch('http://localhost:5001/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password
          }),
        })
        const loginData = await loginResponse.json()
        if (loginData.success) {
          setUser(loginData.data.user)
          localStorage.setItem('token', loginData.data.token)
        }
      } else {
        alert(data.message || '注册失败')
      }
    } catch (error) {
      console.error('注册错误:', error)
      alert('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 登录
  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUser(data.data.user)
        // 保存token到localStorage
        localStorage.setItem('token', data.data.token)
      } else {
        alert(data.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      alert('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 退出
  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
  }

  return (
    <UserContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export default UserProvider
