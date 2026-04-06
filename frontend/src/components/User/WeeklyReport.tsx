import React, { useState, useEffect } from 'react';
import './WeeklyReport.css';

interface CheckinData {
  date: string;
  total_time: number;
  session_count: number;
  words_learned: number;
  correct_rate: number;
}

interface WeeklyReportData {
  week_start: string;
  week_end: string;
  total_days: number;
  total_time: number;
  total_words: number;
  correct_count?: number;
  wrong_count?: number;
  words_mastered?: number;
  streak_days?: number;
  total_sessions?: number;
  is_generated: boolean;
}

export const WeeklyReport: React.FC = () => {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0);

  useEffect(() => {
    loadReportData();
  }, [selectedWeek]);

  const loadReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [reportResponse, checkinsResponse] = await Promise.all([
        fetch('http://localhost:5001/api/learning/weekly-report', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5001/api/learning/checkin?days=7', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const reportData = await reportResponse.json();
      const checkinsData = await checkinsResponse.json();

      if (reportData.success) {
        setReport(reportData.data);
      }
      if (checkinsData.success) {
        setCheckins(checkinsData.data.checkins || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load report data:', error);
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? mins + '分' : ''}`;
    }
    return `${mins}分钟`;
  };

  const getWeekNumber = (dateString: string) => {
    const date = new Date(dateString);
    const start = new Date(date.getFullYear(), 0, 1);
    const week = Math.floor((date.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return week + 1;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  };

  if (loading) {
    return <div className="loading">加载周报中...</div>;
  }

  return (
    <div className="weekly-report">
      {/* 顶部标题 */}
      <div className="report-header">
        <h2>📊 学习周报</h2>
        {report && (
          <div className="week-info">
            <span className="week-badge">
              第 {getWeekNumber(report.week_start)} 周
            </span>
            <span className="date-range">
              {formatDate(report.week_start)} - {formatDate(report.week_end)}
            </span>
          </div>
        )}
      </div>

      {/* 统计概览 */}
      {report && (
        <div className="stats-overview">
          <div className="stat-card main">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <span className="stat-value">{formatTime(report.total_time)}</span>
              <span className="stat-label">总学习时长</span>
            </div>
          </div>
          
          <div className="stat-card main">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <span className="stat-value">{report.total_words}</span>
              <span className="stat-label">学习单词数</span>
            </div>
          </div>
          
          <div className="stat-card main">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <span className="stat-value">{report.total_days}</span>
              <span className="stat-label">打卡天数</span>
            </div>
          </div>

          {report.correct_count !== undefined && (
            <div className="stat-card main">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <span className="stat-value">
                  {report.correct_count && report.total_words > 0
                    ? `${((report.correct_count / report.total_words) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
                <span className="stat-label">正确率</span>
              </div>
            </div>
          )}

          {report.streak_days !== undefined && (
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <span className="stat-value">{report.streak_days}</span>
                <span className="stat-label">连续学习</span>
              </div>
            </div>
          )}

          {report.words_mastered !== undefined && (
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-value">{report.words_mastered}</span>
                <span className="stat-label">已掌握</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 每日学习详情 */}
      <div className="daily-details">
        <h3>📅 每日学习详情</h3>
        <div className="checkins-grid">
          {checkins.length === 0 ? (
            <div className="empty-state">
              <p>本周还没有学习记录</p>
              <p className="empty-hint">开始学习吧！</p>
            </div>
          ) : (
            checkins.map((checkin, index) => (
              <div
                key={index}
                className="checkin-card"
              >
                <div className="date-header">
                  <span className="day-name">{getDayName(checkin.date)}</span>
                  <span className="date-text">{formatDate(checkin.date)}</span>
                </div>
                
                <div className="checkin-stats">
                  <div className="mini-stat">
                    <span className="mini-icon">⏰</span>
                    <span className="mini-value">{formatTime(checkin.total_time)}</span>
                  </div>
                  
                  <div className="mini-stat">
                    <span className="mini-icon">📚</span>
                    <span className="mini-value">{checkin.words_learned} 词</span>
                  </div>
                  
                  <div className="mini-stat">
                    <span className="mini-icon">🔄</span>
                    <span className="mini-value">{checkin.session_count} 次</span>
                  </div>
                  
                  {checkin.correct_rate !== undefined && (
                    <div className="mini-stat">
                      <span className="mini-icon">🎯</span>
                      <span className="mini-value">
                        {checkin.correct_rate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 学习建议 */}
      {report && report.total_days > 0 && (
        <div className="learning-tips">
          <h3>💡 学习建议</h3>
          <div className="tips-list">
            {report.total_days < 5 && (
              <div className="tip-card warning">
                <span className="tip-icon">⚠️</span>
                <p>本周学习天数较少，建议每天至少学习15分钟</p>
              </div>
            )}
            
            {report.total_words < 50 && (
              <div className="tip-card info">
                <span className="tip-icon">📝</span>
                <p>本周学习词汇较少，目标设定为每天学习10个新单词</p>
              </div>
            )}
            
            {report.correct_count !== undefined && 
             report.total_words > 0 && 
             report.correct_count / report.total_words < 0.8 && (
              <div className="tip-card warning">
                <span className="tip-icon">🎯</span>
                <p>正确率较低，建议复习错题本中的单词</p>
              </div>
            )}
            
            {report.total_days >= 5 && report.total_words >= 50 && (
              <div className="tip-card success">
                <span className="tip-icon">🎉</span>
                <p>学习表现优秀！继续保持这个节奏</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
