import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  level: number;
  streak: number;
}

type PeriodType = 'all' | 'week' | 'month';

export const Leaderboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFriends, setShowFriends] = useState(false);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();

    // BUG-003修复：添加轮询机制实现排行榜实时更新
    // 每30秒自动刷新一次排行榜数据
    const pollInterval = setInterval(() => {
      loadLeaderboard();
      if (showFriends) {
        loadFriendsLeaderboard();
      }
    }, 30000);

    // 组件卸载时清除定时器
    return () => {
      clearInterval(pollInterval);
    };
  }, [period, showFriends]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const userId = localStorage.getItem('user_id');
      const response = await fetch(
        `http://localhost:5001/api/gamification/leaderboard?period=${period}&user_id=${userId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.data.leaderboard);
        setMyRank(data.data.my_rank);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setLoading(false);
    }
  };

  const loadFriendsLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/gamification/leaderboard/friends?period=${period}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        setFriendsLeaderboard(data.data.leaderboard);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load friends leaderboard:', error);
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

  const handleToggleFriends = () => {
    if (!showFriends) {
      loadFriendsLeaderboard();
    }
    setShowFriends(!showFriends);
  };

  const getPeriodLabel = (p: PeriodType) => {
    const labels = {
      all: '总排行榜',
      week: '周排行榜',
      month: '月排行榜'
    };
    return labels[p];
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getLevelBadge = (level: number) => {
    const colors = [
      '#9ca3af', // Level 0
      '#3b82f6', // Level 1
      '#10b981', // Level 2
      '#f59e0b', // Level 3
      '#ef4444', // Level 4
      '#8b5cf6', // Level 5
      '#ec4899'  // Level 6
    ];
    return {
      backgroundColor: colors[Math.min(level, 6)]
    };
  };

  const currentData = showFriends ? friendsLeaderboard : leaderboard;

  return (
    <div className="leaderboard">
      {/* 头部 */}
      <div className="leaderboard-header">
        <h2>🏆 排行榜</h2>
        <div className="header-controls">
          {/* 周期切换 */}
          <div className="period-tabs">
            <button
              className={`period-tab ${period === 'week' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('week')}
            >
              本周
            </button>
            <button
              className={`period-tab ${period === 'month' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('month')}
            >
              本月
            </button>
            <button
              className={`period-tab ${period === 'all' ? 'active' : ''}`}
              onClick={() => handlePeriodChange('all')}
            >
              总榜
            </button>
          </div>

          {/* 好友切换 */}
          <button
            className={`friends-toggle ${showFriends ? 'active' : ''}`}
            onClick={handleToggleFriends}
          >
            👥 {showFriends ? '全服排行榜' : '好友排行榜'}
          </button>
        </div>
      </div>

      {/* 我的排名 */}
      {myRank && !showFriends && (
        <div className="my-rank-card">
          <div className="rank-icon">📍</div>
          <div className="rank-info">
            <h3>我的排名</h3>
            <div className="my-rank">第 {myRank} 名</div>
          </div>
          <div className="rank-divider"></div>
          <div className="rank-action">
            <button onClick={() => {
              // 滚动到用户位置
              const myEntry = document.querySelector('.leaderboard-entry.my-rank-entry');
              if (myEntry) {
                myEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}>
              查看我
            </button>
          </div>
        </div>
      )}

      {/* 排行榜列表 */}
      <div className="leaderboard-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : (
          <>
            {currentData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>
                  {showFriends 
                    ? '还没有好友，快去添加吧！' 
                    : '暂无排行榜数据'}
                </p>
              </div>
            ) : (
              currentData.map((entry, index) => {
                const isMe = !showFriends && entry.rank === myRank;
                
                return (
                  <div
                    key={entry.rank}
                    className={`leaderboard-entry ${isMe ? 'my-rank-entry' : ''}`}
                  >
                    {/* 排名 */}
                    <div className="rank-column">
                      <div className="medal-icon">{getMedalIcon(entry.rank)}</div>
                    </div>

                    {/* 用户信息 */}
                    <div className="user-column">
                      <div className="username">{entry.username}</div>
                      <div 
                        className="level-badge"
                        style={getLevelBadge(entry.level)}
                      >
                        Level {entry.level}
                      </div>
                    </div>

                    {/* 统计数据 */}
                    <div className="stats-column">
                      <div className="stat-item">
                        <span className="stat-label">积分</span>
                        <span className="stat-value">{entry.points}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">连胜</span>
                        <span className="stat-value">{entry.streak}天</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* 排行榜说明 */}
      <div className="leaderboard-info">
        <h4>📖 排行榜规则</h4>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">🏆</div>
            <div className="info-content">
              <h5>总排行榜</h5>
              <p>按历史总积分排名</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">📅</div>
            <div className="info-content">
              <h5>周/月排行榜</h5>
              <p>按周期内获得积分排名</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">👥</div>
            <div className="info-content">
              <h5>好友排行榜</h5>
              <p>仅显示好友间的排名</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⭐</div>
            <div className="info-content">
              <h5>获取积分</h5>
              <p>学习单词、完成任务、每日打卡</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
