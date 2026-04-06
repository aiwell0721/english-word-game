import React, { useState } from 'react'
import { useUser } from './UserProvider'
import './LoginPage.css'

interface LoginProps {
  onRegisterClick: () => void
}

const LoginPage: React.FC<LoginProps> = ({ onRegisterClick }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [gradeLevel, setGradeLevel] = useState(1)
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login, register } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegister) {
        await register(username, password, gradeLevel)
      } else {
        await login(username, password)
      }
    } catch (error) {
      console.error('认证错误:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">
          {isRegister ? '注册账号' : '欢迎回来'}
        </h1>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="gradeLevel">年级</label>
              <select
                id="gradeLevel"
                className="form-input"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(parseInt(e.target.value))}
              >
                <option value={1}>一年级</option>
                <option value={2}>二年级</option>
                <option value={3}>三年级</option>
                <option value={4}>四年级</option>
                <option value={5}>五年级</option>
                <option value={6}>六年级</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '处理中...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        <div className="toggle-auth">
          {isRegister ? (
            <p>
              已有账号？
              <button
                type="button"
                className="link-button"
                onClick={() => setIsRegister(false)}
              >
                登录
              </button>
            </p>
          ) : (
            <p>
              还没有账号？
              <button
                type="button"
                className="link-button"
                onClick={() => setIsRegister(true)}
              >
                立即注册
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage
