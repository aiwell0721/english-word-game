import React, { useState, useEffect } from 'react';
import './ParentLogin.css';

export const ParentLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [childUserId, setChildUserId] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const endpoint = isRegister ? 'parent/register' : 'parent/login';
      const body = isRegister 
        ? { username, password, email, child_user_id: parseInt(childUserId) || null }
        : { username, password };

      const response = await fetch(`http://localhost:5001/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (!isRegister) {
          // 保存家长token
          localStorage.setItem('parentToken', data.data.token);
          localStorage.setItem('parentInfo', JSON.stringify(data.data.parent));
        }
      } else {
        setError(data.error || '操作失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="parent-login">
      <div className="login-container">
        <div className="login-header">
          <h1>👨 家长登录</h1>
          <p>监控孩子的学习进度，设置学习时间管理</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>{isRegister ? '注册成功！' : '登录成功！'}</h3>
            <p>{isRegister 
              ? '家长账户已创建，请登录'
              : '正在跳转到家长控制台...'}
            </p>
            {!isRegister && (
              <button
                className="action-btn"
                onClick={() => window.location.href = '/parent/dashboard'}
              >
                进入家长控制台
              </button>
            )}
            <button
              className="back-btn"
              onClick={() => setSuccess(false)}
            >
              {isRegister ? '去登录' : '返回'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>

            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>

            {isRegister && (
              <>
                <div className="form-group">
                  <label>邮箱（可选）</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                  />
                </div>

                <div className="form-group">
                  <label>关联学生ID（可选）</label>
                  <input
                    type="number"
                    value={childUserId}
                    onChange={(e) => setChildUserId(e.target.value)}
                    placeholder="请输入学生ID"
                  />
                  <p className="form-hint">
                    可以在注册后关联学生
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
            </button>

            <div className="toggle-link">
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
              >
                {isRegister 
                  ? '已有账户？去登录'
                  : '还没有账户？去注册'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="features-section">
        <h3>✨ 家长控制台功能</h3>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h4>学习监控</h4>
            <p>实时查看孩子的学习进度、掌握单词数、正确率</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⏰</span>
            <h4>时间管理</h4>
            <p>设置每日学习时长上限，防止过度使用</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📅</span>
            <h4>学习报告</h4>
            <p>定期接收学习周报，了解孩子学习情况</p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h4>进度对比</h4>
            <p>与同年级其他学生对比，了解相对位置</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;
