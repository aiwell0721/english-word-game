import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// 每个测试后清理
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string): string | null => {
      return store[key] || null
    },
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length(): number {
      return Object.keys(store).length
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

// Mock fetch
global.fetch = vi.fn()

// Mock Notification
const notificationMock = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'default',
}

Object.defineProperty(global, 'Notification', {
  value: notificationMock,
})

// Mock setTimeout
global.setTimeout = vi.fn((callback, delay) => {
  return callback()
}) as any

// Mock setInterval
global.setInterval = vi.fn((callback, delay) => {
  return 1 as any
}) as any

// Mock clearInterval
global.clearInterval = vi.fn()

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 2,
  writable: true,
})

// Mock Request
global.Request = vi.fn()

// Mock Response
global.Response = vi.fn()
