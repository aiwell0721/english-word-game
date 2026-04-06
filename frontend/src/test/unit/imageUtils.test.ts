import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getOptimalImageUrl, getImageSizeStyle } from '../../utils/imageUtils'

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

  it('DPR=1 时返回@1x 图片', () => {
    window.devicePixelRatio = 1
    const result = getOptimalImageUrl('http://example.com/image.png')
    expect(result).toBe('http://example.com/image.png')
  })

  it('DPR=2 时返回@2x 图片', () => {
    window.devicePixelRatio = 2
    const result = getOptimalImageUrl('http://example.com/image.png')
    expect(result).toBe('http://example.com/image@2x.png')
  })

  it('DPR=3 时返回@3x 图片', () => {
    window.devicePixelRatio = 3
    const result = getOptimalImageUrl('http://example.com/image.png')
    expect(result).toBe('http://example.com/image@3x.png')
  })

  it('emoji 表情直接返回，不修改', () => {
    const emoji = '😀'
    const result = getOptimalImageUrl(emoji)
    expect(result).toBe(emoji)
  })

  it('data: URL 直接返回，不修改', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KG...'
    const result = getOptimalImageUrl(dataUrl)
    expect(result).toBe(dataUrl)
  })

  it('图片 URL 为空时返回空字符串', () => {
    const result = getOptimalImageUrl('')
    expect(result).toBe('')
  })

  it('getImageSizeStyle 正确返回不同 DPR 的样式', () => {
    window.devicePixelRatio = 3
    const style = getImageSizeStyle(200)

    expect(style).toHaveProperty('width')
    expect(style.width).toBe('300px')
    expect(style.height).toBe('auto')
    expect(style.imageRendering).toBeDefined()
  })

  it('DPR=2 时返回@2x 样式', () => {
    window.devicePixelRatio = 2
    const style = getImageSizeStyle(100)

    expect(style.width).toBe('120px')
    expect(style.height).toBe('auto')
  })

  it('DPR=1 时返回@1x 样式', () => {
    window.devicePixelRatio = 1
    const style = getImageSizeStyle(100)

    expect(style.width).toBe('100px')
    expect(style.height).toBe('auto')
  })

  it('支持 jpg 扩展名', () => {
    window.devicePixelRatio = 2
    const result = getOptimalImageUrl('http://example.com/image.jpg')
    expect(result).toBe('http://example.com/image@2x.jpg')
  })

  it('支持 webp 扩展名', () => {
    window.devicePixelRatio = 2
    const result = getOptimalImageUrl('http://example.com/image.webp')
    expect(result).toBe('http://example.com/image@2x.webp')
  })
})
