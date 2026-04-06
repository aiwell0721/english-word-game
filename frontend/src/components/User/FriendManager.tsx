import React, { useState, useEffect } from 'react';
import './FriendManager.css';

interface Friend {
  id: number;
  username: string;
  grade_level: number;
  accepted_at?: string;
  status: string;
}

interface PendingRequest {
  request_id: number;
  username: string;
  grade_level: number;
  requested_at: string;
}

interface SearchResult {
  id: number;
  username: string;
  grade_level: number;
}

export const FriendManager: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, set]endingRequests] = useState<PendingRequest[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'search'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadFriends(), loadPendingRequests()]);
    setLoading(false);
  };

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) setFriends(data.data);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/friends/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) setendingRequests(data.data);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        `http://localhost:5001/api/friends/search?keyword=${encodeURIComponent(searchKeyword)}&limit=10}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) setSearchResults(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to search users:', error);
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId: number, username: string) => {
    if (!confirm(`确定要添加 "${username}" 为好友吗？`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/friends/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friend_id: friendId })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        setSearchResults([]);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to add friend:', error);
      alert('添加好友失败');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/friends/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!confirm('确定要拒绝这个好友请求吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/friends/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleRemoveFriend = async (frendId: number, username: string) => {
    if (!confirm(`确定要删除好友 "${username}" 吗？`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/friends/${frendId}/remove`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
        await loadData();
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const getGradeLabel = (grade: number) => {
    return `Level ${grade}`;
  };

  return (
    <div className="friend-manager">
      {/* 头部 */}
      <div className="friend-header">
        <h2>👥 好友管理</h2>
        <div className="header-stats">
          <span className="friend-count">
            好友: {friends.length}
          </span>
          {pendingRequests.length > 0 && (
            <span className="pending-badge">
              待处理: {pendingRequests.length}
            </span>
          )}
        </div>
      </div>

      {/* 视图切换 */}
      <div className="view-tabs">
        <button
          className={`tab-btn ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          👥 好友列表
        </button>
        <button
          className={`tab-btn ${view === 'search' ? 'active' : ''}`}
          onClick={() => setView('search')}
        >
          🔍 添加好友
        </button>
      </div>

      {/* 待处理的好友请求 */}
      {pendingRequests.length > 0 && (
        <div className="pending-section">
          <h3>📨 待处理的好友请求</h3>
          <div className="requests-list">
            {pendingRequests.map(request => (
              <div key={request.request_id} className="request-card">
                <div className="request-info">
                  <div className="username">{request.username}</div>
                  <div className="grade-badge">{getGradeLabel(request.grade_level)}</div>
                  <div className="request-time">
                    请求时间: {new Date(request.requested_at).toLocaleString()}
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="action-btn accept"
                    onClick={() => handleAcceptRequest(request.request_id)}
                  >
                    ✅ 接受
                  </button>
                  <button
                    className="action-btn reject"
                    onClick={() => handleRejectRequest(request.request_id)}
                  >
                    ❌ 拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 好友列表视图 */}
      {view === 'list' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>还没有好友，快去添加吧！</p>
              <button
                className="add-friends-btn"
                onClick={() => setView('search')}
              >
                去添加好友
              </button>
            </div>
          ) : (
            friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <div className="friend-avatar">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <div className="username">{friend.username}</div>
                  <div className="grade-badge">{getGradeLabel(friend.grade_level)}</div>
                  {friend.accepted_at && (
                    <div className="friend-time">
                      成为好友: {new Date(friend.accepted_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="friend-actions">
                  <button
                    className="action-btn battle"
                    onClick={() => {
                      // 触发好友PK对战
                      alert('好友PK对战功能开发中...');
                    }}
                  >
                    ⚔️ PK对战
                  </button>
                  <button
                    className="action-btn remove"
                    onClick={() => handleRemoveFriend(friend.id, friend.username)}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 搜索添加好友视图 */}
      {view === 'search' && (
        <div className="search-view">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="输入用户名搜索..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? '⏳' : '🔍'}
            </button>
          </div>

          <div className="search-results">
            {searchResults.length === 0 ? (
              <div className="empty-results">
                <p>输入用户名搜索并添加好友</p>
              </div>
            ) : (
              searchResults.map(user => {
                const isFriend = friends.some(f => f.id === user.id);
                
                return (
                  <div key={user.id} className="search-result-card">
                    <div className="user-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <div className="username">{user.username}</div>
                      <div className="grade-badge">{getGradeLabel(user.grade_level)}</div>
                    </div>
                    <div className="user-actions">
                      {isFriend ? (
                        <span className="status-badge friend">
                          ✅ 已是好友
                        </span>
                      ) : (
                        <button
                          className="action-btn add"
                          onClick={() => handleAddFriend(user.id, user.username)}
                        >
                          👥 添加好友
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
