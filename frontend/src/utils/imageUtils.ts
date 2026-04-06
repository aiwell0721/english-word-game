/**
 * 图片工具函数
 * 用于处理高分屏图片适配
 */

/**
 * 获取适合当前设备的图片URL
 * 根据设备DPR自动加载@2x或@3x图片
 */
export const getOptimalImageUrl = (baseUrl: string): string => {
  if (!baseUrl) return '';

  // 如果URL是emoji表情，直接返回
  if (baseUrl.startsWith('data:') || /^[^\w\s-]/.test(baseUrl)) {
    return baseUrl;
  }

  const dpr = window.devicePixelRatio || 1;

  // 提取文件扩展名
  const lastDotIndex = baseUrl.lastIndexOf('.');
  if (lastDotIndex === -1) return baseUrl;

  const filename = baseUrl.substring(0, lastDotIndex);
  const extension = baseUrl.substring(lastDotIndex);

  // 根据DPR返回合适的图片
  if (dpr >= 3) {
    return `${filename}@3x${extension}`;
  } else if (dpr >= 2) {
    return `${filename}@2x${extension}`;
  } else {
    return baseUrl; // @1x
  }
};

/**
 * 预加载图片
 * 用于提前加载避免闪烁
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
) => {
    if (!url) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`Failed to preload image: ${url}`);
      resolve(); // 不拒绝，避免阻塞
    };
    img.src = url;
  });
};

/**
 * 批量预加载图片
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  const promises = urls.map(url => preloadImage(url));
  await Promise.all(promises);
};

/**
 * 获取图片尺寸样式
 * 根据设备DPR调整显示尺寸
 */
export const getImageSizeStyle = (baseSize: number) => {
  const dpr = window.devicePixelRatio || 1;
  
  // 高分屏上使用更大的显示尺寸
  if (dpr >= 3) {
    return {
      width: `${baseSize * 1.5}px`,
      height: `${baseSize * 1.5}px`,
      maxWidth: '100%',
      height: 'auto',
      imageRendering: '-webkit-optimize-contrast' as any,
      imageRendering: 'optimize-contrast' as any,
      imageRendering: 'crisp-edges' as any,
    };
  } else if (dpr >= 2) {
    return {
      width: `${baseSize * 1.2}px`,
      height: `${baseSize * 1.2}px`,
      maxWidth: '100%',
      height: 'auto',
      imageRendering: '-webkit-optimize-contrast' as any,
      imageRendering: 'optimize-contrast' as any,
      imageRendering: 'crisp-edges' as any,
    };
  } else {
    return {
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      maxWidth: '100%',
      height: 'auto',
    };
  }
};

/**
 * 为图片元素应用高分屏适配
 */
export const applyHighDPIStyles = (imgElement: HTMLImageElement): void => {
  const dpr = window.devicePixelRatio || 1;

  if (dpr >= 2) {
    imgElement.style.imageRendering = '-webkit-optimize-contrast' as any;
    imgElement.style.imageRendering = 'optimize-contrast' as any;
    imgElement.style.imageRendering = 'crisp-edges' as any;
    imgElement.style.imageRendering = 'pixelated' as any;
  }
};
