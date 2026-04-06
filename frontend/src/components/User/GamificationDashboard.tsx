import React, { useState, useEffect } from 'react';
import { Leaderboard } from './Leaderboard';
import { initDailyTaskManager, isNewDay } from '../../utils/dailyTaskManager';
import './GamificationDashboard.css';

interface PointsInfo {
  total_points: number;
  daily_points: number;
  level: number;
  experience: number;
  streak: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
}

interface DailyTask {
  id: number;
  name: string;
  description: string;
  points_reward: number;
  condition_value: number;
  progress: number;
  is_completed: boolean;
  completed_at?: string;
}

// BUG-004修复：成就弹窗队列类
class AchievementQueue {
  private queue: Achievement[] = [];
  private isShowing = false;
  private onAchievementShow?: (achievement: Achievement) => void;

  constructor(onAchievementShow?: (achievement: Achievement) => void) {
    this.onAchievementShow = onAchievementShow;
  }

  async show(achievement: Achievement) {
    this.queue.push(achievement);
    this.process();
  }

  private async process() {
    if (this.isShowing || this.queue.length === 0) {
      return;
    }

    this.isShowing = true;
    const achievement = this.queue.shift();

    if (achievement && this.onAchievementShow) {
      // 显示弹窗
      this.onAchievementShow(achievement);

      // 延迟0.5秒
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isShowing = false;
    this.process();
  }
}
[\nexport const GamificationDashboard: React.FC = () => {
  const [pointsInfo, setPointsInfo] = useState<PointsInfo | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'points' | 'achievements' | 'tasks' | 'leaderboard'>('points');
  const [currentAchievementPopup, setCurrentAchievementPopup] = useState<Achievement | null>(null);
  
  // BUG-004修复：初始化成就弹窗队列
  const achievementQueue = React.useRef(new AchievementQueue((achievement) => {
    setCurrentAchievementPopup(achievement);
  })).current;

  useEffect(() => {
    loadData();
    
    // BUG-006修复：初始化每日任务管理
    initDailyTaskManager();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 并行加载所有数据
      const [pointsRes, achievementsRes, tasksRes] = await Promise.all([
        fetch('http://localhost:5000/api/gamification/points', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/gamification/achievements/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/gamification/daily-tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const pointsData = await pointsRes.json();
      const achievementsData = await achievementsRes.json();
      const tasksData = await tasksRes.json();

      if (pointsData.success) setPointsInfo(pointsData.data);
      if (achievementsData.success) setAchievements(achievementsData.data);
      if (tasksData.success) setDailyTasks(tasksData.data);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load gamification data:', error);
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/gamification/daily-tasks/${taskId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: 1 })
      });

      const data = await response.json();
      if (data.success) {
        // BUG-004修复：检查是否解锁成就，如果有则加入队列
        if (data.points_earned > 0) {
          const unlockedAchievements = achievements.filter(a => !a.unlocked && pointsInfo);
          if (unlockedAchievements.length > 0) {
            unlockedAchievements.forEach(achievement => {
              achievementQueue.show(achievement);
            });
          }
        }
        
        // BUG-006修复：如果任务完成，检查是否需要重置（下一日）
        if (data.is_completed && isNewDay()) {
          console.log('📅 检测到新的一天，准备重置每日任务');
          // 下次加载时会自动重置
        }
        
        loadData(); // 重新加载数据
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };
  
  // BUG-004修复：关闭成就弹窗
  const closeAchievementPopup = () => {
    setCurrentAchievementPopup(null);
  };

  const getLevelProgress = () => {
    if (!pointsInfo) return 0;
    // 简单的等级进度计算：1000经验值升级
    const experienceInLevel = pointsInfo.experience % 1000;
    return (experienceInLevel / 1000) * 100;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="gamification-dashboard">
      {/* 顶部积分概览 */}
      {pointsInfo && (
        <div className="points-header">
          <div className="total-points">
            <h2>🌟 {pointsInfo.total_points} 积分</h2>
            <p>今日 +{pointsInfo.daily_points}</p>
          </div>
          <div className="level-info">
            <div className="level-badge">等级 {pointsInfo.level}</div>
            <div className="experience-bar">
              <div
                className="experience-fill"
                style={{ width: `${getLevelProgress()}%` }}
              ></div>
            </div>
          </div>
          <div className="streak-badge">
            🔥 {pointsInfo.streak} 天连胜
          </div>
        </div>
      )}

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          积分详情
        </button>
        <button
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          成就 ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </button>
        <button
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          排行榜
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          每日任务
        </button>
      </div>

      {/* 内容区域 */}
      <div className="tab-content">
        {activeTab === 'points' && (
          <div className="points-tab">
            <div className="points-grid">
              <div className="points-card">
                <h3>📊 总积分</h3>
                <p className="points-value">{pointsInfo?.total_points || 0}</p>
              </div>
              <div className="points-card">
                <h3>📅 今日积分</h3>
                <p className="points-value">{pointsInfo?.daily_points || 0}</p>
              </div>
              <div className="points-card">
                <h3>⬆️ 等级</h3>
                <p className="points-value">{pointsInfo?.level || 1}</p>
              </div>
              <div className="points-card">
                <h3>🔥 连胜天数</h3>
                <p className="points-value">{pointsInfo?.streak || 0}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-grid">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    <span className="points-reward">+{achievement.points_reward} 积分</span>
                  </div>
                  {achievement.unlocked && (
                    <div className="achievement-status">✅ 已解锁</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-tab">
            <Leaderboard />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-tab">
            <div className="tasks-list">
              {dailyTasks.map(task => (
                <div
                  key={task.id}
                  className={`task-card ${task.is_completed ? 'completed' : ''}`}
                >
                  <div className="task-info">
                    <h3>{task.name}</h3>
                    <p>{task.description}</p>
                    <span className="task-reward">+{task.points_reward} 积分</span>
                  </div>
                  <div className="task-progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.min(task.progress / task.condition_value * 100, 100)}%`
                      }}
                    ></div>
                    <span className="progress-text">
                      {task.progress}/{task.condition_value}
                    </span>
                  </div>
                  {!task.is_completed && (
                    <button
                      className="complete-btn"
                      onClick={() => handleCompleteTask(task.id)}
                    >
                      完成
                    </button>
                  )}
                  {task.is_completed && (
                    <div className="task-status">✅ 已完成</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* BUG-BUG-004修复：成就弹窗渲染 */}
      {currentAchievementPopup && (
        <div className="achievement-popup-overlay" onClick={closeAchievementPopup}>
          <div className="achievement-popup" onClick={(e) => e.stopPropagation()}>
            <div className="achievement-popup-icon">
              {currentAchievementPopup.icon}
            </div>
            <div className="achievement-popup-content">
              <h3 className="achievement-popup-title">
                🎉 解锁成就！
              </h3>
              <p className="achievement-popup-name">
                {currentAchievementPopup.name}
              </p>
              <p className="achievement-popup-description">
                {currentAchievementPopup.description}
              </p>
              <div className="achievement-popup-reward">
                <span className="reward-icon">🌟</span>
                <span className="reward-text">+{currentAchievementPopup.points_reward} 积分</span>
              </div>
            </div>
            <button className="achievement-popup-close" onClick={closeAchievementPopup}>
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
