/**
 * 类型定义
 */

// 用户相关类型
export interface User {
  id: number
  username: string
  email: string
  grade_level: number // 1-6年级
  created_at: string
  last_active: string
}

export interface AuthResponse {
  token: string
  user: User
}

// 词汇相关类型
export interface Word {
  id: number
  word: string
  phonetic: string
  meaning: string
  level: number
  category: string
  image_url?: string
  audio_url?: string
  example?: string
  example_translation?: string
}

export interface WordProgress {
  word_id: number
  correct_count: number
  wrong_count: number
  last_reviewed: string
  mastery_level: number // 0-5, 未掌握到完全掌握
}

// 游戏模式
export type GameMode = 'spelling' | 'choice' | 'listening' | 'matching'

export interface GameSession {
  id: number
  user_id: number
  mode: GameMode
  level: number
  words_count: number
  correct_count: number
  started_at: string

 completed_at?: string
}

// 游戏化系统
export interface UserPoints {
  user_id: number
  total_points: number
  level: number
}

export interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  points: number
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  unlocked_at: string
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 学习进度统计
export interface StudyStats {
  total_words: number
  mastered_words: number
  learning_words: number
  total_sessions: number
  accuracy: number
}
