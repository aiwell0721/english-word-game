import React, { useState, useEffect } from 'react';
import './ThemeManager.css';

interface Theme {
  id: number;
  name: string;
  description: string;
  category: 'free' | 'premium';
  points_cost: number;
  preview_url: string;
  css_config: {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    card_background: string;
    text_color: string;
    accent_color: string;
    button_radius: string;
    font_family: string;
  };
}

interface UserTheme extends Theme {
  is_active: boolean;
  unlocked_at?: string;
}

export const ThemeManager: React.FC = () => {
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [myThemes, setMyThemes] = useState<UserTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      // 并行加载所有数据
      const [themesRes, myThemesRes, activeRes, pointsRes] = await Promise.all([
        fetch('http://localhost:5001/api/themes'),
        fetch('http://localhost:5001/api/themes/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5001/api/themes/my/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5001/api/gamification/points', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const themesData = await themesRes.json();
      const myThemesData = await myThemesRes.json();
      const activeData = await activeRes.json();
      const pointsData = await pointsRes.json();

      if (themesData.success) setAllThemes(themesData.data);
      if (myThemesData.success) setMyThemes(myThemesData.data);
      if (activeData.success) setActiveTheme(activeData.data);
      if (pointsData.success) setUserPoints(pointsData.data.total_points);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load theme data:', error);
      setError('加载主题数据失败');
      setLoading(false);
    }
  };

  const handleUnlock = async (theme: Theme) => {
    if (theme.category === 'premium' && userPoints < theme.points_cost) {
      alert(`积分不足！需要 ${theme.points_cost} 积分，你当前有 ${userPoints} 积分`);
      return;
    }

    if (!confirm(`确定要解锁 "${theme.name}" 主题吗？\n${theme.category === 'premium' ? `消耗 ${theme.points_cost} 积分` : '免费'}`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/themes/${theme.id}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        // 重新加载数据
        loadData();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to unlock theme:', error);
      alert('解锁主题失败');
    }
  };

  const handleActivate = async (themeId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/themes/${themeId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // 重新加载数据
        loadData();
        // 应用主题到页面
        applyTheme(myThemes.find(t => t.id === themeId));
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to activate theme:', error);
      alert('激活主题失败');
    }
  };

  const applyTheme = async (theme?: Theme) => {
    const targetTheme = theme || activeTheme;
    if (!targetTheme) return;

    // BUG-008修复：添加CSS过渡动画
    const root = document.documentElement as HTMLElement;
    const config = targetTheme.css_config;
    
    // 添加过渡动画
    root.style.transition = 'all 0.3s ease';
    
    // 应用主题CSS变量
    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // 等待过渡完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 移除过渡动画（避免影响其他样式变化）
    root.style.transition = '';

    // 保存到localStorage
    localStorage.setItem('activeTheme', JSON.stringify(targetTheme));
  };

  const isUnlocked = (themeId: number) => {
    return myThemes.some(t => t.id === themeId);
  };

  const isActive = (themeId: number) => {
    return activeTheme?.id === themeId;
  };

  if (loading) {
    return (
      <div className="theme-manager loading">
        <div className="loading-spinner"></div>
        <p>加载主题中...</p>
      </div>
    );
  }

  return (
    <div className="theme-manager">
      {/* 头部 */}
      <div className="theme-header">
        <h2>🎨 主题皮肤</h2>
        <div className="user-points">
          <span className="points-label">我的积分:</span>
          <span className="points-value">🪙 {userPoints}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* 当前主题预览 */}
      {activeTheme && (
        <div className="current-theme-preview">
          <h3>当前主题</h3>
          <div 
            className="theme-card active"
            style={{
              '--preview-bg': activeTheme.css_config.background_color,
              '--preview-card': activeTheme.css_config.card_background,
              '--preview-text': activeTheme.css_config.text_color,
              '--preview-primary': activeTheme.css_config.primary_color,
              '--preview-accent': activeTheme.css_config.accent_color
            } as React.CSSProperties}
          >
            <div className="theme-info">
              <div className="theme-name-badge">
                {activeTheme.category === 'free' ? '🆓 免费' : '💎 高级'}
              </div>
              <h4 className="theme-title">{activeTheme.name}</h4>
              <p className="theme-description">{activeTheme.description}</p>
            </div>
            <div className="theme-status">
              <span className="status-badge active">✅ 已激活</span>
            </div>
          </div>
        </div>
      )}

      {/* 主题列表 */}
      <div className="themes-grid">
        <h3>所有主题</h3>
        <div className="themes-list">
          {allThemes.map(theme => {
            const unlocked = isUnlocked(theme.id);
            const active = isActive(theme.id);

            return (
              <div 
                key={theme.id}
                className={`theme-card ${active ? 'active' : ''} ${unlocked ? 'unlocked' : ''}`}
                style={{
                  '--preview-bg': theme.css_config.background_color,
                  '--preview-card': theme.css_config.card_background,
                  '--preview-text': theme.css_config.text_color,
                  '--preview-primary': theme.css_config.primary_color,
                  '--preview-accent': theme.css_config.accent_color
                } as React.CSSProperties}
              >
                {/* 主题预览 */}
                <div className="theme-preview">
                  <div className="preview-elements">
                    <div className="preview-btn">按钮</div>
                    <div className="preview-text">示例文字</div>
                  </div>
                </div>

                {/* 主题信息 */}
                <div className="theme-info">
                  <div className="theme-category-badge">
                    {theme.category === 'free' ? '🆓 免费' : `💎 高级 (${theme.points_cost}积分)`}
                  </div>
                  <h4 className="theme-title">{theme.name}</h4>
                  <p className="theme-description">{theme.description}</p>
                </div>

                {/* 操作按钮 */}
                <div className="theme-actions">
                  {!unlocked && (
                    <button
                      className="action-btn unlock"
                      onClick={() => handleUnlock(theme)}
                      disabled={loading}
                    >
                      {theme.category === 'free' ? '🆓 解锁' : `💎 解锁 (${theme.points_cost})`}
                    </button>
                  )}

                  {unlocked && !active && (
                    <button
                      className="action-btn activate"
                      onClick={() => handleActivate(theme.id)}
                      disabled={loading}
                    >
                      ✅ 激活
                    </button>
                  )}

                  {active && (
                    <span className="status-badge active">✅ 已激活</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 主题说明 */}
      <div className="theme-info-section">
">
        <h4>📖 关于主题</h4>
        <ul>
          <li>免费主题：无需积分，直接解锁使用</li>
          <li>高级主题：需要消耗积分解锁，解锁后可永久使用</li>
          <li>积分获取：通过学习单词、完成任务、每日打卡获得</li>
          <li>主题切换：解锁多个主题后可随时切换</li>
        </ul>
      </div>
    </div>
  );
};
