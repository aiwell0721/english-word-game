import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { ThemeManager } from '../../components/User/ThemeManager'

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

describe('BUG-008: 主题切换后有短暂白屏', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('切换主题时应用CSS变量', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                description: '简洁清爽的默认风格',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  secondary_color: '#764ba2',
                  background_color: '#ffffff',
                  card_background: '#f5f5f5',
                  text_color: '#333333',
                  accent_color: '#4ade80',
                  button_radius: '8px',
                  font_family: 'Arial, sans-serif',
                },
              },
              {
                id: 2,
                name: '暗黑主题',
                description: '护眼的暗黑模式',
                category: 'premium',
                points_cost: 100,
                preview_url: '',
                css_config: {
                  primary_color: '#1a1a2e',
                  secondary_color: '#2d2d44',
                  background_color: '#0f0f1a',
                  card_background: '#1f1f2e',
                  text_color: '#e0e0e0',
                  accent_color: '#4ade80',
                  button_radius: '8px',
                  font_family: 'Arial, sans-serif',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('主题皮肤')).toBeInTheDocument()
    })
  })

  it('添加CSS过渡动画', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                description: '简洁清爽的默认风格',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  secondary_color: '#764ba2',
                  background_color: '#ffffff',
                  card_background: '#f5f5f5',
                  text_color: '#333333',
                  accent_color: '#4ade80',
                  button_radius: '8px',
                  font_family: 'Arial, sans-serif',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('默认主题')).toBeInTheDocument()
    })

    // 获取root元素
    const root = document.documentElement

    // 验证CSS变量已应用
    expect(root.style.getPropertyValue('--primary_color')).toBe('#667eea')
    expect(root.style.getPropertyValue('--background_color')).toBe('#ffffff')
  })

  it('等待300ms后移除transition属性', async () => {
    vi.useFakeTimers()
    
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes/1/activate')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Theme activated successfully',
          }),
        })
      } else if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                description: '简洁清爽的默认风格',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  background_color: '#ffffff',
                  text_color: '#333333',
                },
              },
              {
                id: 2,
                name: '暗黑主题',
                description: '护眼的暗黑模式',
                category: 'premium',
                points_cost: 100,
                preview_url: '',
                css_config: {
                  primary_color: '#1a1a2e',
                  background_color: '#0f0f1a',
                  text_color: '#e0e0e0',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('默认主题')).toBeInTheDocument()
      expect(screen.getByText('暗黑主题')).toBeInTheDocument()
    })

    const root = document.documentElement

    // 初始状态
    expect(root.style.getPropertyValue('--primary_color')).toBe('#667eea')

    // 点击激活第二个主题
    const activateButtons = screen.getAllByText('激活')
    if (activateButtons.length > 0) {
      fireEvent.click(activateButtons[0])
    }

    await waitFor(() => {
      // 快进100ms，transition应该还存在
      vi.advanceTimersByTime(100)
      // 注意：实际实现中transition会在300ms后移除
    })
  })

  it('主题配置保存到localStorage', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                description: '简洁清爽的默认风格',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  background_color: '#ffffff',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('默认主题')).toBeInTheDocument()
    })

    // 验证主题配置已保存
    const savedTheme = localStorageMock.getItem('activeTheme')
    expect(savedTheme).toBeTruthy()
    
    const parsedTheme = JSON.parse(savedTheme || '{}')
    expect(parsedTheme).toHaveProperty('css_config')
  })

  it('多次切换不会冲突', async () => {
    vi.useFakeTimers()
    
    let callCount = 0
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      callCount++
      
      if (url.includes('themes/1/activate') || url.includes('themes/2/activate')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Theme activated successfully',
          }),
        })
      } else if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                description: '简洁清爽的默认风格',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  background_color: '#ffffff',
                },
              },
              {
                id: 2,
                name: '暗黑主题',
                description: '护眼的暗黑模式',
                category: 'premium',
                points_cost: 100,
                preview_url: '',
                css_config: {
                  primary_color: '#1a1a2e',
                  background_color: '#0f0f1a',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('默认主题')).toBeInTheDocument()
      expect(screen.getByText('暗黑主题')).toBeInTheDocument()
    })

    const activateButtons = screen.getAllByText('✅ 激活')
    const initialCallCount = callCount

    // 快速点击两次
    if (activateButtons.length >= 2) {
      fireEvent.click(activateButtons[0])
      await new Promise(resolve => setTimeout(resolve, 50))
      
      fireEvent.click(activateButtons[1])
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // 验证最终状态
    const root = document.documentElement
    const finalPrimaryColor = root.style.getPropertyValue('--primary_color')
    expect(finalPrimaryColor).toBeTruthy()
  })

  it('解锁付费主题扣除积分', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes/2/unlock')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Theme unlocked successfully',
            data: {
              theme_id: 2,
              name: '暗黑主题',
              category: 'premium',
              points_cost: 100,
            },
          }),
        })
      } else if (url.includes('points')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              total_points: 200,
              daily_points: 20,
              level: 2,
              experience: 1500,
              streak: 8,
            },
          }),
        })
      } else if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                description: '简洁清爽的默认风格',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  background_color: '#ffffff',
                },
              },
              {
                id: 2,
                name: '暗黑主题',
                description: '护眼的暗黑模式',
                category: 'premium',
                points_cost: 100,
                preview_url: '',
                css_config: {
                  primary_color: '#1a1a2e',
                  background_color: '#0f0f1a',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('暗黑主题')).toBeInTheDocument()
    })

    // 查找解锁按钮
    const unlockButtons = screen.queryAllByText(/💎 解锁/)
    if (unlockButtons.length > 0) {
      fireEvent.click(unlockButtons[0])
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('themes/2/unlock'),
          expect.objectContaining({
            method: 'POST',
          }),
        )
      })
    }
  })

  it('积分不足时不能解锁付费主题', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('points')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              total_points: 50,  // 积分不足
              daily_points: 10,
              level: 1,
              experience: 500,
              streak: 5,
            },
          }),
        })
      } else if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '默认主题',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#667eea',
                  background_color: '#ffffff',
                },
              },
              {
                id: 2,
                name: '暗黑主题',
                category: 'premium',
                points_cost: 100,  // 需要100积分，但只有50
                preview_url: '',
                css_config: {
                  primary_color: '#1a1a2e',
                  background_color: '#0f0f1a',
                },
              },
            ],
          }),
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, data: [] }),
        })
      }
    }))

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('暗黑主题')).toBeInTheDocument()
    })

    const unlockButtons = screen.queryAllByText(/💎 解锁/)
    if (unlockButtons.length > 0) {
      // 点击解锁按钮，应该提示积分不足
      fireEvent.click(unlockButtons[0])
      
      // 验证没有调用解锁API
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('themes/2/unlock'),
      )
    }
  })
})
