import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { Leaderboard } from '../../components/User/Leaderboard'

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

describe('BUG-003: 排行榜更新延迟', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('组件加载时调用排行榜 API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
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

    vi.stubGlobal('fetch', mockFetch)

    render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api/gamification/leaderboard'),
        expect.any(Object)
      )
    })
  })

  it('30 秒后自动刷新排行榜', async () => {
    let fetchCount = 0

    const mockFetch = vi.fn().mockImplementation(() => {
      fetchCount++
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            period: 'all',
            leaderboard: [],
            my_rank: null,
          },
        }),
      })
    })

    vi.stubGlobal('fetch', mockFetch)

    render(<Leaderboard />)

    await waitFor(() => expect(fetchCount).toBe(1))

    // 快进 30 秒
    vi.advanceTimersByTime(30000)

    await waitFor(() => expect(fetchCount).toBe(2))
  })

  it('切换周期时重新加载排行榜', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          period: 'all',
          leaderboard: [],
          my_rank: null,
        },
      }),
    })

    vi.stubGlobal('fetch', mockFetch)

    render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // 切换周期
    const weeklyButton = screen.getByText('周榜')
    if (weeklyButton) {
      fireEvent.click(weeklyButton)
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('切换好友/全服排行榜时重新加载', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          period: 'all',
          leaderboard: [],
          my_rank: null,
        },
      }),
    })

    vi.stubGlobal('fetch', mockFetch)

    render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // 切换好友榜
    const friendsButton = screen.getByText('好友榜')
    if (friendsButton) {
      fireEvent.click(friendsButton)
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('组件卸载时清除定时器', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          period: 'all',
          leaderboard: [],
          my_rank: null,
        },
      }),
    })

    vi.stubGlobal('fetch', mockFetch)

    const { unmount } = render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // 卸载组件
    unmount()

    // 快进 30 秒，不应该再调用 fetch
    vi.advanceTimersByTime(30000)

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
