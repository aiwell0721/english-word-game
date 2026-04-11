import React, { useState, useEffect } from 'react';
import './WrongAnswersBook.css';

interface WrongAnswer {
  id: number;
  word: string;
  meaning: string;
  level: number;
  user_answer: string;
  correct_answer: string;
  error_type: string;
  practice_count: number;
  mastered: boolean;
  first_mistake_at: string;
  last_practice_at: string | null;
}

export const WrongAnswersBook: React.FC = () => {
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'frequency' | 'level'>('date');

  useEffect(() => {
    loadWrongAnswers();
  }, [filter, sortBy]);

  const loadWrongAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      let url = 'http://localhost:5001/api/learning/wrong-answers?limit=50';
      if (filter === 'mastered') {
        url += '&mastered=true';
      } else if (filter === 'unmastered') {
        url += '&mastered=false';
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        let sortedAnswers = [...data.data];
        
        if (sortBy === 'frequency') {
          sortedAnswers.sort((a, b) => b.practice_count - a.practice_count);
        } else if (sortBy === 'level') {
          sortedAnswers.sort((a, b) => a.level - b.level);
        }
        // 'date' is default (already sorted by first_mistake_at DESC)

        setWrongAnswers(sortedAnswers);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load wrong answers:', error);
      setLoading(false);
    }
  };

  const getErrorTypeLabel = (errorType: string) => {
    const labels: { [key: string]: string } = {
      'wrong': '拼写错误',
      'meaning': '词义错误',
      'spelling': '拼写错误',
      'listening': '听写错误',
      'matching': '匹配错误'
    };
    return labels[errorType] || errorType;
  };

  const getErrorTypeColor = (errorType: string) => {
    const colors: { [key: string]: string } = {
      'wrong': '#ff6b6b',
      'meaning': '#ffa502',
      'spelling': '#ff6b6b',
      'listening': '#4ecdc4',
      'matching': '#ffd93d'
    };
    return colors[errorType] || '#999';
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="wrong-answers-book">
      <div className="book-header">
        <h2>📓 错题本</h2>
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-value">{wrongAnswers.length}</span>
            <span className="stat-label">错题总数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {wrongAnswers.filter(w => w.mastered).length}
            </span>
            <span className="stat-label">已掌握</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {wrongAnswers.filter(w => !w.mastered).length}
            </span>
            <span className="stat-label">待复习</span>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>筛选：</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unmastered' | 'mastered')}
          >
            <option value="all">全部</option>
            <option value="unmastered">未掌握</option>
            <option value="mastered">已掌握</option>
          </select>
        </div>
        <div className="filter-group">
          <label>排序：</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'frequency' | 'level')}
          >
            <option value="date">按日期</option>
            <option value="frequency">按练习次数</option>
            <option value="level">按年级</option>
          </select>
        </div>
      </div>

      <div className="wrong-answers-list">
        {wrongAnswers.length === 0 ? (
          <div className="empty-state">
            <p>✨ 太棒了！还没有错题</p>
            <p className="empty-hint">继续努力学习吧！</p>
          </div>
        ) : (
          wrongAnswers.map((answer) => (
            <div
              key={answer.id}
              className={`wrong-answer-card ${answer.mastered ? 'mastered' : ''}`}
            >
              {answer.mastered && (
                <div className="mastered-badge">✅ 已掌握</div>
              )}
              <div className="word-info">
                <div className="word-header">
                  <h3 className="word-text">{answer.word}</h3>
                  <span className="level-badge">Level {answer.level}</span>
                </div>
                <p className="word-meaning">{answer.meaning}</p>
              </div>
              
              <div className="error-details">
                <div className="error-comparison">
                  <div className="error-answer">
                    <label>你的答案：</label>
                    <span className="wrong-text">{answer.user_answer}</span>
                  </div>
                  <div className="correct-answer">
                    <label>正确答案：</label>
                    <span className="correct-text">{answer.correct_answer}</span>
                  </div>
                </div>
                <div className="error-meta">
                  <span
                    className="error-type-badge"
                    style={{ background: getErrorTypeColor(answer.error_type) }}
                  >
                    {getErrorTypeLabel(answer.error_type)}
                  </span>
                  <span className="practice-count">
                    练习 {answer.practice_count} 次
                  </span>
                  <span className="first-mistake">
                    {new Date(answer.first_mistake_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>

              <div className="action-buttons">
                <button className="practice-btn">
                  📝 立即复习
                </button>
                {!answer.mastered && (
                  <button className="mark-mastered-btn">
                    ✅ 标记已掌握
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
