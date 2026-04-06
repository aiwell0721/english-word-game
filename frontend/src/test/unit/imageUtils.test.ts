import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getOptimalImageUrl, getImageSizeStyle } from '../utils/imageUtils'

describe('BUG-005: 图片显示高分屏模糊', () => {
  beforeEach(() => {
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      value: 1,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('DPR=1时返回@1x图片', () => {
    window.devicePixelRatio = 1
    const result = getOptimalImageUrl('http://example.com/image.png')
    expect(result).toBe('http://example.com/image.png')
  })

  it('DPR=2时返回@2x图片', () => {
    window.devicePixelRatio = 2
    const result = getOptimalImageUrl('http://example.com/image.png')
    expect(result).toBe('http://example.com/image@2x.png')
  })

  it('DPR=3时返回@3x图片', () => {
    window.devicePixelRatio = 3
    const result = getOptimalImageUrl('http://example.com/image.png')
    expect(result).toBe('http://example.com/image@3x.png')
  })

  it('emoji表情直接返回，不修改', () => {
    const emoji = '😀'
    const result = getOptimalImageUrl(emoji)
    expect(result).toBe(emoji)
  })

  it('data: URL直接返回，不修改', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KG...'
    const result = getOptimalImageUrl(dataUrl)
    expect(result).toBe(dataUrl)
  })

  it('图片URL为空时返回空字符串', () => {
    const result = getOptimalImageUrl('')
    expect(result).toBe('')
  })

  it('getImageSizeStyle正确返回不同DPR的样式', () => {
    window.devicePixelRatio = 3
    const style = getImageSizeStyle(200)

    expect(style).toHaveProperty('width')
    expect(style.width).toBe('300px')
    expect(style.height).toBe('300px')
    expect(style.imageRendering).toBeDefined()
  })

  it('DPR=2时返回@2x样式', () => {
    window.devicePixelRatio = 2
    const style = getImageSizeStyle(100)

    expect(style.width).toBe('120px')
    expect(style.height).toBe('120px')
  })

  it('DPR=1时返回@1x样式', () => {
    window.devicePixelRatio = 1
    const style = getImageSizeStyle(100)

    expect(style.width).toBe('100px')
    expect(style.height).toBe('100px')
  })

  it('支持jpg扩展名', () => {
    window.devicePixelRatio = 2
    const result = getOptimalImageUrl('http://example.com/image.jpg')
    expect(result).toBe('http://example.com/image@2x.jpg')
  })

  it('支持webp扩展名', () => {
    window.devicePixelRatio = 2
    const result = getOptimalImageUrl('http://example.com/image.webp')
    expect(result).toBe('http://example.com/image@2x.webp')
  })
})
