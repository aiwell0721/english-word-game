import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { Leaderboard } from '../components/User/Leaderboard'

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
    // Mock fetch
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('组件加载时调用排行榜API', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
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
    }))

    render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContainingContaining('api/gamification/leaderboard'),
        expect.any(Object)
      )
    })
  })

  it('30秒后自动刷新排行榜', async () => {
    let fetchCount = 0

    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
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
    }))

    render(<Leaderboard />)

    await waitFor(() => expect(fetchCount).toBe(1))

    // 快进30秒
    vi.advanceTimersByTime(30000)

    await waitFor(() => expect(fetchCount).toBe(2))
  })

  it('切换周期时重新加载排行榜', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: { period: 'all', leaderboard: [], my_rank: null },
      }),
    }))

    render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const weekButton = screen.getByText('本周')
    fireEvent.click(weekButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('切换好友/全服排行榜时重新加载', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: { period: 'all', leaderboard: [], my_rank: null },
      }),
    }))

    render(<Leaderboard />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const friendsButton = screen.getByText(/好友排行榜/i)
    fireEvent.click(friendsButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  it('组件卸载时清除定时器', () => {
    const mockSetInterval = vi.spyOn(global, 'setInterval')
    const mockClearInterval = vi.spyOn(global, 'clearInterval')

    const { unmount } = render(<Leaderboard />)

    expect(mockSetInterval).toHaveBeenCalled()

    unmount()

    expect(mockClearInterval).toHaveBeenCalled()
  })
})
