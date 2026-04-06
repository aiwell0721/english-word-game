import React, { useState, useEffect } from 'react';
import './SocialShare.css';

interface Share {
  id: number;
  share_type: 'achievement' | 'badge' | 'milestone';
  content: any;
  platform: string;
  shared_at: string;
}

export const SocialShare: React.FC = () => {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShareType, setSelectedShareType] = useState<'achievement' | 'badge' | 'milestone'>('achievement');

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/social/shares?limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setShares(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load shares:', error);
      setLoading(false);
    }
  };

  const handleShare = async (shareType: string, content: any, platform: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/social/share', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          share_type: shareType,
          content: content,
          platform: platform
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}\n获得 ${data.points_earned} 积分`);
        loadShares();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to share:', error);
      alert('分享失败');
    }
  };

  const getShareTypeLabel = (type: string) => {
    const labels = {
      achievement: '成就分享',
      badge: '徽章分享',
      milestone: '里程碑分享'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      wechat: '💬',
      qq: '🐧',
      weibo: '🌐',
      moments: '📱'
    };
    return icons[platform] || '📤';
  };

  const shareContent = {
    achievement: {
      title: '🎉 学习达人成就！',
      description: '我完成了连续学习7天的成就！',
      image: '🏆',
      points: 500
    },
    badge: {
      title: '🏅 拼写小能手',
      description: '我获得了拼写小能手徽章！',
      image: '✍️',
      points: 300
    },
    milestone: {
      title: '📚 掌握100个单词',
      description: '我已经掌握了100个英语单词！',
      image: '🎯',
      points: 1000
    }
  };

  return (
    <div className="social-share">
      {/* 头部 */}
      <div className="share-header">
        <h2>📤 社交分享</h2>
        <div className="share-summary">
          <span className="share-count">
            分享记录: {shares.length}
          </span>
          <span className="share-tip">
            分享可获得 +3 积分
          </span>
        </div>
      </div>

      {/* 分享类型选择 */}
      <div className="share-types">
        <h3>选择分享内容</h3>
        <div className="type-tabs">
          {(['achievement', 'badge', 'milestone'] as const).map(type => (
            <button
              key={type}
              className={`type-tab ${selectedShareType === type ? 'active' : ''}`}
              onClick={() => setSelectedShareType(type)}
            >
              <span className="type-icon">{shareContent[type].image}</span>
              <span className="type-label">{getShareTypeLabel(type)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 分享内容预览 */}
      <div className="share-preview">
        <div className="preview-card">
          <div className="preview-icon">{shareContent[selectedShareType].image}</div>
          <div className="preview-content">
            <h4>{shareContent[selectedShareType].title}</h4>
            <p>{shareContent[selectedShareType].description}</p>
            <div className="preview-points">
              +{shareContent[selectedShareType].points} 积分
            </div>
          </div>
        </div>
      </div>

      {/* 分享平台选择 */}
      <div className="share-platforms">
        <h3>选择分享平台</h3>
        <div className="platforms-grid">
          {[
            { id: 'wechat', name: '微信', icon: '💬' },
            { id: 'qq', name: 'QQ', icon: '🐧' },
            { id: 'weibo', name: '微博', icon: '🌐' },
            { id: 'moments', name: '朋友圈', icon: '📱' }
          ].map(platform => (
            <button
              key={platform.id}
              className="platform-btn"
              onClick={() => handleShare(selectedShareType, shareContent[selectedShareType], platform.id)}
            >
              <span className="platform-icon">{platform.icon}</span>
              <span className="platform-name">{platform.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 分享历史 */}
      <div className="share-history">
        <h3>分享历史</h3>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : shares.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📤</div>
            <p>还没有分享记录</p>
          </div>
        ) : (
          <div className="history-list">
            {shares.map(share => (
              <div key={share.id} className="history-card">
                <div className="history-platform">
                  {getPlatformIcon(share.platform)}
                </div>
                <div className="history-content">
                  <div className="history-type">
                    {getShareTypeLabel(share.share_type)}
                  </div>
                  <div className="history-title">
                    {share.content.title}
                  </div>
                </div>
                <div className="history-time">
                  {new Date(share.shared_at).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分享说明 */}
      <div className="share-info">
        <h4>📖 分享说明</h4>
        <ul>
          <li>分享成就、徽章、里程碑可获得积分奖励</li>
          <li>每次分享获得 <strong>+3 积分</strong></li>
          <li>支持微信、QQ、微博、朋友圈等平台</li>
          <li>分享记录会保存在历史中</li>
        </ul>
      </div>
    </div>
  );
};
