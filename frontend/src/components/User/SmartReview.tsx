import React, { useState, useEffect } from 'react';
import './SmartReview.css';

interface ReviewPlan {
  id: number;
  word: string;
  meaning: string;
  level: number;
  review_date: string;
  stage: number;
  interval_days: number;
  ease_factor: number;
  is_reviewed: boolean;
  reviewed_at?: string;
  is_correct?: boolean;
}

export const SmartReview: React.FC = () => {
  const [reviewPlans, setReviewPlans] = useState<ReviewPlan[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    correct: 0,
    incorrect: 0
  });

  useEffect(() => {
    loadReviewPlans();
  }, []);

  const loadReviewPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/learning/review-plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setReviewPlans(data.data);
        setStats({
          total: data.data.length,
          reviewed: data.data.filter((r: ReviewPlan) => r.is_reviewed).length,
          correct: data.data.filter((r: ReviewPlan) => r.is_reviewed && r.is_correct).length,
          incorrect: data.data.filter((r: ReviewPlan) => r.is_reviewed && !r.is_correct).length
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load review plans:', error);
      setLoading(false);
    }
  };

  const currentWord = reviewPlans[currentIndex];
  const isLastCard = currentIndex === reviewPlans.length - 1;

  const handleSubmitAnswer = async (isCorrect: boolean) => {
    if (!currentWord) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/learning/review-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word_id: currentWord.id,
          is_correct: isCorrect
        })
      });

      const data = await response.json();
      if (data.success) {
        // 更新统计
        setStats({
          total: stats.total,
          reviewed: stats.reviewed + 1,
          correct: stats.correct + (isCorrect ? 1 : 0),
          incorrect: stats.incorrect + (isCorrect ? 0 : 1)
        });

        // 移动到下一张卡片
        setShowAnswer(false);
        setUserAnswer('');
        
        if (!isLastCard) {
          setCurrentIndex(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to submit review answer:', error);
    }
  };

  const handleSkip = () => {
    if (!isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setUserAnswer('');
    }
  };

  const getProgress = () => {
    return reviewPlans.length > 0 
      ? ((currentIndex + 1) / reviewPlans.length) * 100 
      : 0;
  };

  const getStageLabel = (stage: number) => {
    const stages = ['首次复习', '第2次复习', '第3次复习', '第4次复习', '熟练'];
    return stages[Math.min(stage - 1, stages.length - 1)];
  };

  if (loading) {
    return <div className="loading">加载复习计划中...</div>;
  }

  return (
    <div className="smart-review">
      {/* 顶部统计 */}
      <div className="review-header">
        <h2>🧠 智能复习</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">待复习</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.reviewed}</span>
            <span className="stat-label">已复习</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.correct}</span>
            <span className="stat-label">正确</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.incorrect}</span>
            <span className="stat-label">错误</span>
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {currentIndex + 1} / {reviewPlans.length}
        </span>
      </div>

      {/* 复习卡片 */}
      {currentWord ? (
        <div className="review-card">
          <div className="card-header">
            <span className="stage-badge">{getStageLabel(currentWord.stage)}</span>
            <span className="level-badge">Level {currentWord.level}</span>
            <span className="interval-badge">
              间隔 {currentWord.interval_days} 天
            </span>
          </div>

          <div className="card-content">
            <h3 className="word-text">{currentWord.word}</h3>
            {!showAnswer ? (
              <button
                className="show-answer-btn"
                onClick={() => setShowAnswer(true)}
              >
                查看释义
              </button>
            ) : (
              <div className="meaning-section">
                <p className="word-meaning">{currentWord.meaning}</p>
                
                {!currentWord.is_reviewed && (
                  <div className="answer-section">
                    <div className="answer-buttons">
                      <button
                        className="answer-btn correct"
                        onClick={() => handleSubmitAnswer(true)}
                      >
                        ✅ 我记住了
                      </button>
                      <button
                        className="answer-btn incorrect"
                        onClick={() => handleSubmitAnswer(false)}
                      >
                        ❌ 我忘了
                      </button>
                    </div>
                  </div>
                )}

                {currentWord.is_reviewed && (
                  <div className="result-badge">
                    {currentWord.is_correct ? '✅ 记住了' : '❌ 忘了'}
                  </div>
                )}
              </div>
            )}
          </div>

          {!showAnswer && !currentWord.is_reviewed && (
            <div className="card-actions">
              <button className="skip-btn" onClick={handleSkip}>
                跳过此词
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="completion-message">
          <div className="completion-icon">🎉</div>
          <h3>复习完成！</h3>
          <p>你完成了所有待复习的单词</p>
          <div className="completion-stats">
            <p>正确率: <strong>
              {stats.reviewed > 0 
                ? `${(stats.correct / stats.reviewed * 100).toFixed(1)}%`
                : '0%'}
            </strong></p>
            <p>复习完成: <strong>{stats.reviewed}/{stats.total}</strong></p>
          </div>
          <button className="restart-btn" onClick={() => {
            setCurrentIndex(0);
            setShowAnswer(false);
          }}>
            重新开始
          </button>
        </div>
      )}

      {/* 艾宾浩斯曲线说明 */}
      <div className="curve-info">
        <h4>📈 记忆曲线说明</h4>
        <p>系统使用艾宾浩斯遗忘曲线算法，根据你的记忆表现智能调整复习间隔：</p>
        <ul>
          <li>答对 → 间隔延长（加深记忆）</li>
          <li>答错 → 间隔缩短（加强复习）</li>
          <li>间隔天数 = 上次间隔 × 难度系数</li>
        </ul>
      </div>
    </div>
  );
};
