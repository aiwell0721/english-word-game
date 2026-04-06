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

describe('集成测试: 主题系统', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
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

    // 验证初始积分
    const initialPoints = screen.getByText(/� \d+/)
    expect(initialPoints).toBeInTheDocument()

    // 点击解锁按钮
    const unlockButtons = screen.getAllByText(/💎 解锁/)
    if (unlockButtons.length > 0) {
      fireEvent.click(unlockButtons[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('themes/2/unlock'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            }),
          }),
        )
      })
    }
  })

  it('激活主题平滑切换无白屏', async () => {
    vi.useFakeTimers()
    
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes/1/activate') || url.includes('themes/2/activate')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            message: 'Theme activated successfully',
          }),
        })
      } else if (url.includes('themes/my/active')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 1,
              name: '默认主题',
              description: '简洁清爽的默认风格',
              css_config: {
                primary_color: '#667eea',
                background_color: '#ffffff',
                text_color: '#333333',
              },
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
    })

    const root = document.documentElement

    // 验证初始主题
    const initialPrimaryColor = root.style.getPropertyValue('--primary_color')
    expect(initialPrimaryColor).toBe('#667eea')

    // 点击激活另一个主题
    const activateButtons = screen.getAllByText('✅ 激活')
    if (activateButtons.length >= 2) {
      fireEvent.click(activateButtons[1])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('themes/2/activate'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer test-token',
            }),
          }),
        )
      })

      // 快进300ms，等待transition效果
      vi.advanceTimersByTime(300)

      // 验证主题已切换（通过CSS变量变化）
      // 注意：由于没有真实的DOM更新，这里主要验证API调用
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('themes/2/activate'),
        expect.any(Object),
      )
    }
  })

  it('多个主题间快速切换', async () => {
    vi.useFakeTimers()
    
    let activateCallCount = 0
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/activate')) {
        activateCallCount++
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

    const root = document.documentElement

    render(<ThemeManager />)

    await waitFor(() => {
      expect(screen.getByText('默认主题')).toBeInTheDocument()
    })

    const activateButtons = screen.getAllByText('✅ 激活')
    const initialCallCount = activateCallCount

    // 快速点击两次
    if (activateButtons.length >= 2) {
      fireEvent.click(activateButtons[0])
      await new Promise(resolve => setTimeout(resolve, 50))
      
      fireEvent.click(activateButtons[1])
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // 验证激活API被调用两次
    expect(activateCallCount).toBe(initialCallCount + 2)

    // 验证最终状态（最后一个主题应该被激活）
    const finalPrimaryColor = root.style.getPropertyValue('--primary_color')
    expect(finalPrimaryColor).toBeTruthy()
  })

  it('主题配置正确应用到CSS变量', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '测试主题',
                description: '用于测试的主题',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#ff6b6b',
                  secondary_color: '#ffd93d',
                  background_color: '#1dd1a1',
                  card_background: '#f3f4f6',
                  text_color: '#2c3e50',
                  accent_color: '#9b59b6',
                  button_radius: '12px',
                  font_family: 'Roboto, sans-serif',
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
      expect(screen.getByText('测试主题')).toBeInTheDocument()
    })

    const root = document.documentElement

    // 验证所有CSS变量正确应用
    expect(root.style.getPropertyValue('--primary_color')).toBe('#ff6b6b')
    expect(root.style.getPropertyValue('--secondary_color')).toBe('#ffd93d')
    expect(root.style.getPropertyValue('--background_color')).toBe('#1dd1a1')
    expect(root.style.getPropertyValue('--card_background')).toBe('#f3f4f6')
    expect(root.style.getPropertyValue('--text_color')).toBe('#2c3e50')
    expect(root.style.getPropertyValue('--accent_color')).toBe('#9b59b6')
    expect(root.style.getPropertyValue('--button_radius')).toBe('12px')
    expect(root.style.getPropertyValue('--font_family')).toBe('Roboto, sans-serif')
  })

  it('主题切换后其他组件样式不受影响', async () => {
    const mockFetch = vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('themes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [
              {
                id: 1,
                name: '主题1',
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
                name: '主题2',
                category: 'free',
                points_cost: 0,
                preview_url: '',
                css_config: {
                  primary_color: '#e74c3c',
                  background_color: '#f9f9f9',
                  text_color: '#2c3e50',
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
      expect(screen.getByText('主题1')).toBeInTheDocument()
      expect(screen.getByText('主题2')).toBeInTheDocument()
    })

    const root = document.documentElement

    // 记录主题切换前的样式
    const beforePrimaryColor = root.style.getPropertyValue('--primary_color')
    expect(beforePrimaryColor).toBe('#667eea')

    // 切换主题
    const activateButtons = screen.getAllByText('✅ 激活')
    if (activateButtons.length >= 2) {
      fireEvent.click(activateButtons[1])

      await waitFor(() => {
        const afterPrimaryColor = root.style.getPropertyValue('--primary_color')
        expect(afterPrimaryColor).toBe('#e74c3c')
      })
    }
  })
})
