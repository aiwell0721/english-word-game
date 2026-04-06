/**
 * 每日任务管理工具
 * 用于处理每日任务重置
 */

import type { DailyTask } from '../types';

export const DAILY_TASKS_KEY = 'daily_tasks';
export const LAST_OPEN_DATE_KEY = 'last_open_date';

/**
 * 设置次日午夜通知
 * 在应用关闭前调用，确保次日零点重置任务
 */
export const setMidnightReminder = async (): Promise<void> => {
  try {
    // 计算次日午夜时间
    const tomorrowMidnight = new Date();
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
    tomorrowMidnight.setHours(0, 0, 0, 0);

    const reminderTime = tomorrowMidnight.getTime();
    const now = Date.now();

    // 存储提醒时间戳
    localStorage.setItem('midnight_reminder_time', reminderTime.toString());

    console.log(`📅 设置午夜提醒: ${tomorrowMidnight.toLocaleString()}`);

    // 如果浏览器支持Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      const delay = reminderTime - now;
      
      // 使用setTimeout模拟（实际应用中应使用Service Worker）
      if (delay > 0) {
        const reminderId = setTimeout(() => {
          new Notification('每日任务已重置', {
            body: '新的每日任务已准备好，快去完成吧！',
            icon: '/notification-icon.png',
            tag: 'daily-task-reset',
            requireInteraction: false,
          });
          
          // 清除提醒标记
          localStorage.removeItem('midnight_reminder_time');
        }, delay);

        localStorage.setItem('midnight_reminder_id', reminderId.toString());
      }
    }
  } catch (error) {
    console.error('设置午夜提醒失败:', error);
  }
};

/**
 * 检查并重置每日任务
 * 在应用打开时调用，检查日期是否变化
 */
export const checkAndResetDailyTasks = async (): Promise<boolean> => {
  try {
    const lastOpenDate = localStorage.getItem(LAST_OPEN_DATE_KEY);
    const today = new Date().toDateString();

    // 如果日期变化，重置任务
    if (lastOpenDate !== today) {
      console.log(`📅 日期变化: ${lastOpenDate} -> ${today}，重置每日任务`);

      // 重置本地存储的任务进度
      localStorage.setItem(LAST_OPEN_DATE_KEY, today);

      // 清除任务进度缓存
      const cachedTasks = localStorage.getItem(DAILY_TASKS_KEY);
      if (cachedTasks) {
        const tasks: DailyTask[] = JSON.parse(cachedTasks);
        const resetTasks = tasks.map(task => ({
          ...task,
          progress: 0,
          is_completed: false,
          completed_at: null,
        }));
        localStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(resetTasks));
      }

      // 通知用户（如果是首次打开）
      if (lastOpenDate) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('每日任务已重置', {
            body: '新的一天，新的任务！',
            icon: '/notification-icon.png',
            tag: 'daily-task-reset',
          });
        }
      }

      return true; // 已重置
    }

    return false; // 未重置
  } catch (error) {
    console.error('检查每日任务重置失败:', error);
    return false;
  }
};

/**
 * 初始化每日任务管理
 * 在应用启动时调用
 */
export const initDailyTaskManager = async (): Promise<void> => {
  try {
    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // 检查并重置任务
    await checkAndResetDailyTasks();

    // 设置午夜提醒
    await setMidnightReminder();

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时，检查日期
        await checkAndResetDailyTasks();
      } else {
        // 页面隐藏时，重新设置提醒
        await setMidnightReminder();
      }
    });

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      // 清除之前的提醒定时器
      const reminderId = localStorage.getItem('midnight_reminder_id');
      if (reminderId) {
        clearTimeout(parseInt(reminderId));
        localStorage.removeItem('midnight_reminder_id');
      }
    });
  } catch (error) {
    console.error('初始化每日任务管理失败:', error);
  }
};

/**
 * 获取今日日期
 */
export const getTodayDate = (): string => {
  return new Date().toDateString();
};

/**
 * 判断是否是新的一天
 */
export const isNewDay = (): boolean => {
  const lastOpenDate = localStorage.getItem(LAST_OPEN_DATE_KEY);
  const today = getTodayDate();
  return lastOpenDate !== today;
};
