import React, { useState } from 'react'
import { useUser } from './UserProvider'
import SpellingGame from './SpellingGame'
import ChoiceGame from './ChoiceGame'
import ListeningGame from './ListeningGame'
import ImageMatchingGame from './ImageMatchingGame'
import { GamificationDashboard } from './GamificationDashboard'
import { LearningDashboard } from './LearningDashboard'
import { SmartReview } from './SmartReview'
import { ThemeManager } from './ThemeManager'
import { SyncManager } from './SyncManager'
import './Dashboard.css'
import type { GameMode } from '../types'

type ViewType = 'menu' | 'game' | 'gamification' | 'learning' | 'review' | 'theme' | 'sync'

const Dashboard: React.FC = () => {
  const { user, logout } = useUser()
  const [viewType, setViewType] = useState<ViewType>('menu')
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode)
    setViewType('game')
  }

  const handleBackToMenu = () => {
    setSelectedMode(null)
    setViewType('menu')
  }

  const handleShowGamification = () => {
    setViewType('gamification')
  }

  const handleShowLearning = () => {
    setViewType('learning')
  }

  const handleShowReview = () => {
    setViewType('review')
  }

  const handleShowTheme = () => {
    setViewType('theme')
  }

  const handleShowSync = () => {
    setViewType('sync')
  }

  if (!user) {
    return <div>请先登录</div>
  }

  // 如果选择了游戏模式，显示对应游戏组件
  if (viewType === 'game' && selectedMode) {
    switch (selectedMode) {
      case 'spelling':
        return (
          <div className="game-wrapper">
            <button className="back-button" onClick={handleBackToMenu}>
              ← 返回菜单
            </button>
            <SpellingGame level={user.grade_level || 1} wordsCount={5} />
          </div>
        )
      case 'choice':
        return (
          <div className="game-wrapper">
            <button className="back-button" onClick={handleBackToMenu}>
              ← 返回菜单
            </button>
            <ChoiceGame level={user.grade_level || 1} questionsCount={5} />
          </div>
        )
      case 'listening':
        return (
          <div className="game-wrapper">
            <button className="back-button" onClick={handleBackToMenu}>
              ← 返回菜单
            </button>
            <ListeningGame level={user.grade_level || 1} wordsCount={5} />
          </div>
        )
      case 'matching':
        return (
          <div className="game-wrapper">
            <button className="back-button" onClick={handleBackToMenu}>
              ← 返回菜单
            </button>
            <ImageMatchingGame level={user.grade_level || 1} wordsCount={5} />
          </div>
        )
      default:
        return null
    }
  }

  // 显示游戏化仪表板
  if (viewType === 'gamification') {
    return (
      <div className="gamification-wrapper">
        <button className="back-button" onClick={handleBackToMenu}>
          ← 返回菜单
        </button>
        <GamificationDashboard />
      </div>
    )
  }

  // 显示学习管理
  if (viewType === 'learning') {
    return (
      <div className="learning-wrapper">
        <button className="back-button" onClick={handleBackToMenu}>
          ← 返回菜单
        </button>
        <LearningDashboard />
      </div>
    )
  }

  // 显示智能复习
  if (viewType === 'review') {
    return (
      <div className="review-wrapper">
        <button className="back-button" onClick={handleBackToMenu}>
          ← 返回菜单
        </button>
        <SmartReview />
      </div>
    )
  }

  // 显示主题管理
  if (viewType === 'theme') {
    return (
      <div className="theme-wrapper">
        <button className="back-button" onClick={handleBackToMenu}>
          ← 返回菜单
        </button>
        <ThemeManager />
      </div>
    )
  }

  // 显示多设备同步
  if (viewType === 'sync') {
    return (
      <div className="sync-wrapper">
        <button className="back-button" onClick={handleBackToMenu}>
          ← 返回菜单
        </button>
        <SyncManager />
      </div>
    )
  }

  // 显示主菜单
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          <span className="username">欢迎，{user.username}！</span>
          <span className="grade-badge">Level {user.grade_level}</span>
        </div>
        <div className="header-actions">
          <button className="gamification-button" onClick={handleShowGamification}>
            🏆 积分成就
          </button>
          <button className="learning-button" onClick={handleShowLearning}>
            📚 学习管理
          </button>
          <button className="review-button" onClick={handleShowReview}>
            🧠 智能复习
          </button>
          <button className="theme-button" onClick={handleShowTheme}>
            🎨 主题皮肤
          </button>
          <button className="sync-button" onClick={handleShowSync}>
            ☁️ 多设备同步
          </button>
          <button className="logout-button" onClick={logout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-section">
          <h1>选择学习模式</h1>
          <p className="welcome-text">今天想练习哪个模式呢？</p>
        </section>

        <section className="game-modes-grid">
          <div
            className={`game-mode-card ${selectedMode === 'spelling' ? 'selected' : ''}`}
            onClick={() => handleModeSelect('spelling')}
          >
            <div className="mode-icon">✍️</div>
            <h3>拼写模式</h3>
            <p>通过拼写练习巩固单词记忆</p>
          </div>

          <div
            className={`game-mode-card ${selectedMode === 'choice' ? 'selected' : ''}`}
            onClick={() => handleModeSelect('choice')}
          >
            <div className="mode-icon">❓</div>
            <h3>选择题</h3>
            <p>选择正确释义，提升理解能力</p>
          </div>

          <div
            className={`game-mode-card ${selectedMode === 'listening' ? 'selected' : ''}`}
            onClick={() => handleModeSelect('listening')}
          >
            <div className="mode-icon">🎧</div>
            <h3>听音模式</h3>
            <p>听单词发音，选择正确拼写</p>
          </div>

          <div
            className={`game-mode-card ${selectedMode === 'matching' ? 'selected' : ''}`}
            onClick={() => handleModeSelect('matching')}
          >
            <div className="mode-icon">🖼️</div>
            <h3>图片匹配</h3>
            <p>看图片，选择对应单词</p>
          </div>
        </section>

        <section className="stats-section">
          <h2>我的进度</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">286</div>
              <div className="stat-label">已学词汇</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">85%</div>
              <div className="stat-label">掌握率</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">23</div>
              <div className="stat-label">连续学习天数</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
