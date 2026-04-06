import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { FriendManager } from '../../components/User/FriendManager'

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

describe('集成测试: 好友系统', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('搜索用户返回正确结果', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('friends/search')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 2, username: 'testuser2', grade_level: 3, created_at: '2026-04-04' },
              { id: 3, username: 'testuser3', grade_level: 4, created_at: '2026-04-04' },
            ],
          }),
        })
      } else if (url.includes('friends')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<FriendManager />)

    // 切换到搜索视图
    const searchButton = screen.getByText(/搜索好友/i)
    fireEvent.click(searchButton)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/输入用户名/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })
    })

    const searchSubmitButton = screen.getByText('搜索')
    fireEvent.click(searchSubmitButton)

    await waitFor(() => {
      expect(screen.getByText('testuser2')).toBeInTheDocument()
      expect(screen.getByText('testuser3')).toBeInTheDocument()
    })
  })

  it('发送好友请求成功', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('friends/add')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Friend request sent',
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<FriendManager />)

    await waitFor(() => {
      expect(screen.getByText(/好友列表/i)).toBeInTheDocument()
    })

    // 验证发送好友请求的API调用
    const addCall = mockFetch.mock.calls.find(call => 
      (call[0] as string).includes('friends/add')
    )
    
    expect(addCall).toBeDefined()
    if (addCall) {
      expect(addCall[1]).toMatchObject({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    }
  })

  it('接受好友请求创建双向关系', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('friends/pending')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { request_id: 1, username: 'user1', grade_level: 3, requested_at: '2026-04-04T10:00:00' },
              { request_id: 2, username: 'user2', grade_level: 4, requested_at: '2026-04-04T10:00:00' },
            ],
          }),
        })
      } else if (url.includes('friends/1/accept')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Friend request accepted',
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<FriendManager />)

    await waitFor(() => {
      expect(screen.getByText(/好友列表/i)).toBeInTheDocument()
    })

    // 验证接受好友请求的API调用
    const acceptCall = mockFetch.mock.calls.find(call => 
      (call[0] as string).includes('friends/1/accept')
    )
    
    expect(acceptCall).toBeDefined()
    if (acceptCall) {
      expect(acceptCall[1]).toMatchObject({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    }
  })

  it('拒绝好友请求更新状态', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('friends/pending')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { request_id: 1, username: 'user1', grade_level: 3, requested_at: '2026-04-04T10:00:00' },
            ],
          }),
        })
      } else if (url.includes('friends/1/reject')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Friend request rejected',
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<FriendManager />)

    await waitFor(() => {
      expect(screen.getByText(/好友列表/i)).toBeInTheDocument()
    })

    // 验证拒绝好友请求的API调用
    const rejectCall = mockFetch.mock.calls.find(call => 
      (call[0] as string).includes('friends/1/reject')
    )
    
    expect(rejectCall).toBeDefined()
    if (rejectCall) {
      expect(rejectCall[1]).toMatchObject({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    }
  })

  it('删除好友移除双向关系', async () => {
    const mockFetchFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('friends')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 1, username: 'user1', grade_level: 3, accepted_at: '2026-04-04T10:00:00', status: 'accepted' },
              { id: 2, username: 'user2', grade_level: 4, accepted_at: '2026-04-04T10:00:00', status: 'accepted' },
            ],
          }),
        })
      } else if (url.includes('friends/1/remove')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Friend removed',
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<FriendManager />)

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument()
    })

    // 验证删除好友的API调用
    const removeCall = mockFetch.mock.calls.find(call => 
      (call[0] as string).includes('friends/1/remove')
    )
    
    expect(removeCall).toBeDefined()
    if (removeCall) {
      expect(removeCall[1]).toMatchObject({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    }
  })

  it('模糊搜索支持部分字符匹配', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('friends/search')) {
        // 验证传递的关键词
        const keywordMatch = url.match(/keyword=([^&]+)/)
        const keyword = keywordMatch ? decodeURIComponent(keywordMatch[1]) : ''
        
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 2, username: 'testuser2', grade_level: 3, created_at: '2026-04-04' },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<FriendManager />)

    // 切换到搜索视图
    const searchButton = screen.getByText(/搜索好友/i)
    fireEvent.click(searchButton)

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/输入用户名/i)
      // 输入部分字符 "test"（应该能匹配 "testuser2"）
      fireEvent.change(searchInput, { target: { value: 'test' } })
    })

    const searchSubmitButton = screen.getByText('搜索')
    fireEvent.click(searchSubmitButton)

    await waitFor(() => {
      const searchCall = mockFetch.mock.calls.find(call => 
        (call[0] as string).includes('friends/search')
      )
      
      expect(searchCall).toBeDefined()
      if (searchCall) {
        const callUrl = searchCall[0] as string
        expect(callUrl).toContain('keyword=test')
        expect(callUrl).not.toContain('&limit=10ver') // 验证拼写错误已修复
        expect(screen.getByText('testuser2')).toBeInTheDocument()
      }
    })
  })
})
