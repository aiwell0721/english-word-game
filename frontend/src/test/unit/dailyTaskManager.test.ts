import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkAndResetDailyTasks, setMidnightReminder, initDailyTaskManager, isNewDay } from '../utils/dailyTaskManager'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock Date
const today = new Date('2026-04-04').toString()
const yesterday = new Date('2026-04-03').toString()

describe('BUG-006: 每日任务重置时间不准确', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Date.prototype, 'toDateString').mockReturnValue(today)
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('日期变化时返回true（需要重置）', async () => {
    localStorageMock.setItem('last_open_date', yesterday)

'    const needsReset = await checkAndResetDailyTasks()

    expect(needsReset).toBe(true)
  })

  it('日期未变化时返回false（无需重置）', async () => {
    localStorageMock.setItem('last_open_date', today)

    const needsReset = await checkAndResetDailyTasks()

    expect(needsReset).toBe(false)
  })

  it('重置后保存新日期到localStorage', async () => {
    localStorageMock.setItem('last_open_date', yesterday)

    await checkAndResetDailyTasks()

    const savedDate = localStorageMock.getItem('last_open_date')
    expect(savedDate).toBe(today)
  })

  it('首次运行时初始化日期', async () => {
    const savedDate = localStorageMock.getItem('last_open_date')
    expect(savedDate).toBeNull()

    await checkAndResetDailyTasks()

    const newDate = localStorageMock.getItem('last_open_date')
    expect(newDate).toBe(today)
  })

  it('setMidnightReminder计算正确的午夜时间', async () => {
    vi.setSystemTime(new Date('2026-04-04 10:00:00').getTime())

    await setMidnightReminder()

    const reminderTime = localStorageMock.getItem('midnight_reminder_time')
    const expectedTime = new Date('2026-04-05 00:00:00').getTime().toString()

    expect(reminderTime).toBe(expectedTime)
  })

  it('isNewDay正确判断', () => {
    localStorageMock
.setItem('last_open_date', yesterday)
    expect(isNewDay()).toBe(true)

    localStorageMock.setItem('last_open_date', today)
    expect(isNewDay()).toBe(false)
  })

  it('重置任务进度缓存', async () => {
    localStorageMock.setItem('last_open_date', yesterday)
    localStorageMock.setItem('daily_tasks', JSON.stringify([
      { id: 1, progress: 5, is_completed: true },
      { id: 2, progress: 3, is_completed: false },
    ]))

    await checkAndResetDailyTasks()

    const tasks = localStorageMock.getItem('daily_tasks')
    const parsedTasks = JSON.parse(tasks || '[]')

    expect(parsedTasks).toEqual([
      { id: 1, progress: 0, is_completed: false },
      { id: 2, progress: 0, is_completed: false },
    ])
  })
})
