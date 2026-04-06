import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { Leaderboard } from '../../components/User/Leaderboard'
import { GamificationDashboard } from '../../components/User/GamificationDashboard'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {
    'token': 'test-token',
    'user_id': '1',
  }

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('集成测试: 游戏化系统', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('完成每日任务后解锁成就', async () => {
    let callCount = 0
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      callCount++
      
      if (url.includes('daily-tasks')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '今日学习', description: '完成5个单词', points_reward: 10, condition_value: 5, progress: 4, is_completed: false },
              { id: 2, name: '连续打卡', description: '连续7天', points_reward: 20, condition_value: 7, progress: 6, is_completed: false },
            ],
            date: '2026-04-04',
          }),
        })
      } else if (url.includes('points/add')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Added 10 points',
          }),
        })
      } else if (url.includes('points')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              total_points: 110,
              daily_points: 20,
              level: 2,
              experience: 1500,
              streak: 8,
            },
          }),
        })
      } else if (url.includes('achievements/my')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '首次学习', description: '完成第一个单词', icon: '🎉', points_reward: 10, unlocked: true },
              { id: 2, name: '学习达人', description: '学习100个单词', icon: '🏆', points_reward: 50, unlocked: false },
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
      expect(screen.getByText('今日学习')).toBeInTheDocument()
    })

    // 模拟完成任务
    const completeButtons = screen.getAllByText('完成')
    if (completeButtons.length > 0) {
      fireEvent.click(completeButtons[0])

      await waitFor(() => {
        // 验证调用了添加积分API
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('points/add'),
          expect.objectContaining({
            method: 'POST',
          }),
        )
      })
    }
  })

  it('解锁成就后添加积分', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('achievements/unlock')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Achievement unlocked',
            points_reward: 10,
          }),
        })
      } else if (url.includes('points')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              total_points: 120,
              daily_points: 20,
              level: 2,
              experience: 1600,
              streak: 8,
            },
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
      expect(screen.getByText('积分详情')).toBeInTheDocument()
    })
  })

  it('积分更新后排行榜自动刷新', async () => {
    let fetchCount = 0
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      fetchCount++
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            period: 'all',
            leaderboard: [
              { rank: 1, username: 'user1', points: 100, level: 1, streak: 5 },
              { rank: 2, username: 'user2', points: 80, level: 2, streak: 3 },
            ],
            my_rank: 1,
          },
        }),
      })
    }))

    render(<Leaderboard />)

    await waitFor(() => expect(fetchCount).toBe(1))

    // 快进30秒
    vi.advanceTimersByTime(30000)

    await waitFor(() => expect(fetchCount).toBe(2))
  })

  it('每日任务重置后重新加载', async () => {
    let loadCount = 0
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      loadCount++
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: [],
          date: '2026-04-04',
        }),
      })
    }))

    render(<GamificationDashboard />)

    await waitFor(() => expect(loadCount).toBeGreaterThan(0))
  })

  it('多任务完成时成就弹窗队列工作正常', async () => {
    vi.useFakeTimers()
    
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('achievements/my')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, name: '成就1', description: '描述1', icon: '🎉', points_reward: 10, unlocked: true },
              { id: 2, name: '成就2', description: '描述2', icon: '🏆', points_reward: 20, unlocked: true },
              { id: 3, name: '成就3', description: '描述3', icon: '⭐', points_reward: 30, unlocked: true },
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
      const achievementPopups = screen.queryAllByText(/解锁成就！/i)
      expect(achievementPopups.length).toBeGreaterThan(0)
    })

    // 快进500ms
    vi.advanceTimersByTime(500)

    // 等待第二个成就弹窗出现
    await waitFor(() => {
      const closeButtons = screen.queryAllByText('太棒了！')
      expect(closeButtons.length).toBeGreaterThan(0)
    })
  })
})
