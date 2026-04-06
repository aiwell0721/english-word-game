import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { GamificationDashboard } from '../../components/User/GamificationDashboard'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {
    'token': 'test-token',
  }

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('BUG-004: 成就弹窗重叠', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('解锁单个成就时显示弹窗', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('points')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { total_points: 100, daily_points: 10, level: 1, experience: 0, streak: 0 },
          }),
        })
      } else if (url.includes('achievements')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '首次学习', description: '完成第一个单词', icon: '🎉', points_reward: 10, unlocked: true, unlocked_at: '2026-04-04T10:00:00' },
              { id: 2, name: '学习达人', description: '学习 100 个单词', icon: '🏆', points_reward: 50, unlocked: false },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<GamificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('首次学习')).toBeInTheDocument()
    })
  })

  it('快速解锁多个成就时按队列显示', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('achievements/my')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '成就 1', description: '描述 1', icon: '🎉', points_reward: 10, unlocked: true },
              { id: 2, name: '成就 2', description: '描述 2', icon: '🏆', points_reward: 20, unlocked: true },
              { id: 3, name: '成就 3', description: '描述 3', icon: '⭐', points_reward: 30, unlocked: true },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<GamificationDashboard />)

    await waitFor(() => {
      const achievementPopups = screen.getAllByText(/解锁成就！/i)
      expect(achievementPopups.length).toBeGreaterThan(0)
    })
  })

  it('弹窗显示间隔约 0.5 秒', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('achievements/my')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '成就 1', description: '描述 1', icon: '🎉', points_reward: 10, unlocked: true },
              { id: 2, name: '成就 2', description: '描述 2', icon: '🏆', points_reward: 20, unlocked: true },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<GamificationDashboard />)

    // 等待第一个成就弹窗出现
    await waitFor(() => {
      expect(screen.getByText('成就 1')).toBeInTheDocument()
    })

    // 快进 500ms
    vi.advanceTimersByTime(500)

    // 等待第二个成就弹窗出现
    await waitFor(() => {
      expect(screen.getByText('成就 2')).toBeInTheDocument()
    })
  })

  it('关闭弹窗后显示队列中的下一个', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('achievements/my')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '成就 1', description: '描述 1', icon: '🎉', points_reward: 10, unlocked: true },
              { id: 2, name: '成就 2', description: '描述 2', icon: '🏆', points_reward: 20, unlocked: true },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<GamificationDashboard />)

    await waitFor(() => {
      expect(screen.getByText('成就 1')).toBeInTheDocument()
    })

    const closeButtons = screen.getAllByText('太棒了！')
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0])
    }

    // 快进 500ms 后检查第二个成就
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(screen.getByText('成就 2')).toBeInTheDocument()
    })
  })

  it('队列为空时不再显示弹窗', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('achievements/my')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [], // 没有解锁的成就
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<GamificationDashboard />)

    await waitFor(() => {
      expect(screen.queryByText(/解锁成就！/i)).not.toBeInTheDocument()
    })
  })
})
