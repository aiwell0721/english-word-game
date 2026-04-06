import React, { useState } from 'react';
import { WrongAnswersBook } from './WrongAnswersBook';
import { SmartReview } from './SmartReview';
import { WeeklyReport } from './WeeklyReport';
import './LearningDashboard.css';

type LearningView = 'overview' | 'wrong-answers' | 'smart-review' | 'weekly-report';

export const LearningDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<LearningView>('overview');

  const handleViewChange = (view: LearningView) => {
    setActiveView(view);
  };

  return (
    <div className="learning-dashboard">
      {/* 顶部导航 */}
      <div className="learning-header">
        <h1>📚 学习管理</h1>
        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => handleViewChange('overview')}
          >
            📊 概览
          </button>
          <button
            className={`view-tab ${activeView === 'wrong-answers' ? 'active' : ''}`}
            onClick={() => handleViewChange('wrong-answers')}
          >
            📖️ 错题本
          </button>
          <button
            className={`view-tab ${activeView === 'smart-review' ? 'active' : ''}`}
            onClick={() => handleViewChange('smart-review')}
          >
            🧠 智能复习
          </button>
          <button
            className={`view-tab ${activeView === 'weekly-report' ? 'active' : ''}`}
            onClick={() => handleViewChange('weekly-report')}
          >
            📊 周报
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="learning-content">
        {activeView === 'overview' && (
          <div className="overview-panel">
            <div className="overview-grid">
              <div
                className="overview-card"
                onClick={() => handleViewChange('wrong-answers')}
              >
                <div className="card-icon">📖️</div>
                <h3>错题本</h3>
                <p>自动收集错误答案，方便重点复习</p>
                <span className="card-arrow">→</span>
              </div>

              <div
                className="overview-card"
                onClick={() => handleViewChange('smart-review')}
              >
                <div className="card-icon">🧠</div>
                <h3>智能复习</h3>
                <p>基于艾宾浩斯遗忘曲线的复习计划</p>
                <span className="card-arrow">→</span>
              </div>

              <div
                className="overview-card"
                onClick={() => handleViewChange('weekly-report')}
              >
                <div className="card-icon">📊</div>
                <h3>学习周报</h3>
                <p>每周学习统计和数据分析</p>
                <span className="card-arrow">→</span>
              </div>
            </div>

            <div className="learning-tips">
              <h4>💡 学习小贴士</h4>
              <ul>
                <li>每天学习15-20分钟，保持学习节奏</li>
                <li>定期复习错题本，巩固薄弱环节</li>
                <li>完成每日任务，获得积分奖励</li>
                <li>查看学习周报，了解自己的进步</li>
              </ul>
            </div>
          </div>
        )}

        {activeView === 'wrong-answers' && <WrongAnswersBook />}
        {activeView === 'smart-review' && <SmartReview />}
        {activeView === 'weekly-report' && <WeeklyReport />}
      </div>
    </div>
  );
};
