import React, { useState, useEffect } from 'react';
import './ParentDashboard.css';

interface ChildProgress {
  userId: number;
  username: string;
  gradeLevel: number;
  todayStudyTime: number;
  weeklyStudyTime: number;
  masteredWords: number;
  wrongAnswersCount: number;
  accuracy: number;
}

interface LearningReport {
  reportId: number;
  childId: number;
  periodType: string;
  startDate: string;
  endDate: string;
  totalStudyTime: number;
  wordsLearned: number;
  wordsMastered: number;
  avgAccuracy: number;
  completedTasks: number;
  achievements: string[];
}

export const ParentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'reports' | 'settings'>('overview');
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [reports, setReports] = useState<LearningReport[]>([]);

  useEffect(() => {
    loadParentDashboard();
  }, []);

  const loadParentDashboard = async () => {
    setLoading(true);
    try {
      const parentToken = localStorage.getItem('parentToken');
      const parentData = localStorage.getItem('parentInfo');
      
      if (parentData) {
        setParentInfo(JSON.parse(parentData));
      }

      const childrenResponse = await fetch('http://localhost:5001/api/parent/children', {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        if (childrenData.success) {
          setChildren(childrenData.data || []);
          if (childrenData.data && childrenData.data.length > 0) {
            setSelectedChild(childrenData.data[0].userId);
          }
        }
      }

      const reportsResponse = await fetch('http://localhost:5001/api/parent/reports', {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        if (reportsData.success) {
          setReports(reportsData.data || []);
        }
      }

    } catch (err) {
      setError('加载家长数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parentToken');
    localStorage.removeItem('parentInfo');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={loadParentDashboard}>重试</button>
        <button className="back-btn" onClick={handleLogout}>返回登录</button>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">👨‍👩‍👧‍👦</div>
          <div className="header-title">
            <h1>家长控制台</h1>
            <p>监控孩子的学习进度，管理学习时间</p>
          </div>
        </div>
        <div className="header-right">
          <span className="parent-name">{parentInfo?.username || '家长'}</span>
          <button className="logout-btn" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 概览
        </button>
        <button
          className={`nav-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          👁️ 学习监控
        </button>
        <button
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 学习报告
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ 设置
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            children={children} 
            selectedChild={selectedChild}
            onSelectChild={setSelectedChild}
          />
        )}
        {activeTab === 'monitoring' && (
          <MonitoringTab 
            children={children} 
            selectedChild={selectedChild}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTab 
            reports={reports}
            children={children}
            selectedChild={selectedChild}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </main>
    </div>
  );
};

const OverviewTab: React.FC<{
  children: ChildProgress[];
  selectedChild: number | null;
  onSelectChild: (childId: number) => void;
}> = ({ children, selectedChild, onSelectChild }) => {
  const selectedChildData = children.find(c => c.userId === selectedChild);

  if (!selectedChildData) {
    return (
      <div className="no-child-container">
        <div className="no-child-icon">👶</div>
        <h2>还没有关联孩子账户</h2>
        <p>请在注册或设置中关联孩子的学习账户</p>
      </div>
    );
  }

  return (
    <div className="overview-tab">
      <section className="child-selector">
        <h3>选择孩子</h3>
        <div className="children-list">
          {children.map(child => (
            <div
              key={child.userId}
              className={`child-card ${selectedChild === child.userId ? 'selected' : ''}`}
              onClick={() => onSelectChild(child.userId)}
            >
              <div className="child-avatar">👦</div>
              <div className="child-info">
                <div className="child-name">{child.username}</div>
                <div className="child-grade">年级: {child.gradeLevel}</div>
              </div>
              <div className="child-stats">
                <div className="stat-item">
                  <span className="stat-label">已学词汇</span>
                  <span className="stat-value">{child.masteredWords}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">正确率</span>
                  <span className="stat-value">{child.accuracy.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-stats">
        <h2>今日学习概览</h2>
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{selectedChildData.todayStudyTime}分钟</div>
            <div className="stat-label">今日学习时间</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{selectedChildData.masteredWords}</div>
            <div className="stat-label">掌握词汇</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-value">{selectedChildData.wrongAnswersCount}</div>
            <div className="stat-label">错题数量</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-value">{selectedChildData.weeklyStudyTime}分钟</div>
            <div className="stat-label">本周累计</div>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <h3>快捷操作</h3>
        <div className="actions-grid">
          <button className="action-card">
            <div className="action-icon">📝</div>
            <div className="action-title">查看错题本</div>
          </button>
          <button className="action-card">
            <div className="action-icon">🎯</div>
            <div className="action-title">设置学习目标</div>
          </button>
          <button className="action-card">
            <div className="action-icon">⏰</div>
            <div className="action-title">时间管理</div>
          </button>
          <button className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-title">进度对比</div>
          </button>
        </div>
      </section>
    </div>
  );
};

const MonitoringTab: React.FC<{
  children: ChildProgress[];
  selectedChild: number | null;
}> = ({ children, selectedChild }) => {
  const [monitorData, setMonitorData] = useState<any>(null);

  useEffect(() => {
    if (selectedChild) {
      loadMonitorData();
    }
  }, [selectedChild]);

  const loadMonitorData = async () => {
    try {
      const parentToken = localStorage.getItem('parentToken');
      const response = await fetch(`http://localhost:5001/api/parent/monitor/${selectedChild}`, {
        headers: { 'Authorization': `Bearer ${parentToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonitorData(data.data);
        }
      }
    } catch (err) {
      console.error('加载监控数据失败', err);
    }
  };

  if (!selectedChild) {
    return <div className="no-child-message">请选择要监控的孩子</div>;
  }

  return (
    <div className="monitoring-tab">
      <section className="monitor-header">
        <h2>学习监控面板</h2>
        <p>实时监控孩子的学习状态和进度</p>
      </section>

      {monitorData ? (
        <div className="monitor-content">
          <div className="monitor-section">
            <h3>📊 学习统计</h3>
            <div className="monitor-stats">
              <div className="monitor-stat">
                <span className="monitor-label">今日学习</span>
                <span className="monitor-value">{monitorData.today_study_time || 0} 分钟</span>
              </div>
              <div className="monitor-stat">
                <span className="monitor-label">本周学习</span>
                <span className="monitor-value">{monitorData.weekly_study_time || 0} 分钟</span>
              </div>
              <div className="monitor-stat">
                <span className="monitor-label">掌握词汇</span>
                <span className="monitor-value">{monitorData.mastered_words || 0} 个</span>
              </div>
              <div className="monitor-stat">
                <span className="monitor-label">错题数量</span>
                <span className="monitor-value">{monitorData.wrong_answers_count || 0} 个</span>
              </div>
            </div>
          </div>

          <div className="monitor-section">
            <h3>🎯 学习目标</h3>
            <div className="learning-goals">
              <div className="goal-item">
                <span className="goal-label">每日目标</span>
                <span className="goal-value">{monitorData.daily_goal || 30} 分钟</span>
              </div>
              <div className="goal-item">
                <span className="goal-label">完成度</span>
                <span className="goal-value">
                  {Math.min(100, Math.round((monitorData.today_study_time || 0) / (monitorData.daily_goal || 30) * 100))}%
                </span>
              </div>
            </div>
          </div>

          <div className="monitor-section">
            <h3>⚠️ 提醒事项</h3>
            <div className="reminders">
              {monitorData.reminders && monitorData.reminders.length > 0 ? (
                monitorData.reminders.map((reminder: any, index: number) => (
                  <div key={index} className="reminder-item">
                    <span className="reminder-icon">⚠️</span>
                    <span className="reminder-text">{reminder}</span>
                  </div>
                ))
              ) : (
                <div className="no-reminders">暂无提醒事项</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-monitor">加载监控数据中...</div>
      )}
    </div>
  );
};

const ReportsTab: React.FC<{
  reports: LearningReport[];
  children: ChildProgress[];
  selectedChild: number | null;
}> = ({ reports, children, selectedChild }) => {
  return (
    <div className="reports-tab">
      <section className="reports-header">
        <h2>学习报告</h2>
        <p>查看孩子详细的学习数据和进步情况</p>
      </section>

      <div className="reports-list">
        {reports.length > 0 ? (
          reports.map(report => (
            <div key={report.reportId} className="report-card">
              <div className="report-header">
                <h3>{getPeriodLabel(report.periodType)}</h3>
                <span className="report-date">
                  {formatDate(report.startDate)} - {formatDate(report.endDate)}
                </span>
              </div>
              <div className="report-stats">
                <div className="report-stat">
                  <span className="report-label">学习时间</span>
                  <span className="report-value">{report.totalStudyTime}分钟</span>
                </div>
                <div className="report-stat">
                  <span className="report-label">学习词汇</span>
                  <span className="report-value">{report.wordsLearned}个</span>
                </div>
                <div className="report-stat">
                  <span className="report-label">掌握词汇</span>
                  <span className="report-value">{report.wordsMastered}个</span>
                </div>
                <div className="report-stat">
                  <span className="report-label">平均正确率</span>
                  <span className="report-value">{report.avgAccuracy.toFixed(1)}%</span>
                </div>
              </div>
              <div className="report-achievements">
                <h4>🏆 获得成就</h4>
                {report.achievements.length > 0 ? (
                  <div className="achievements-list">
                    {report.achievements.map((achievement, index) => (
                      <span key={index} className="achievement-badge">{achievement}</span>
                    ))}
                  </div>
                ) : (
                  <div className="no-achievements">暂无成就</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-reports">
            <div className="no-reports-icon">📋</div>
            <h3>暂无学习报告</h3>
            <p>孩子开始学习后会生成报告</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState({
    dailyStudyTimeLimit: 60,
    weeklyWordsGoal: 50,
    notificationsEnabled: true,
    notificationTime: '20:00',
    monitorPermissions: true,
    accuracyThreshold: 70
  });

  const handleSaveSettings = async () => {
    try {
      const parentToken = localStorage.getItem('parentToken');
      const response = await fetch('http://localhost:5001/api/parent/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${parentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('设置保存成功！');
      }
    } catch (err) {
      alert('保存设置失败');
    }
  };

  return (
    <div className="settings-tab">
      <section className="settings-header">
        <h2>家长设置</h2>
        <p>自定义学习监控和通知设置</p>
      </section>

      <div className="settings-content">
        <div className="settings-group">
          <h3>🎯 学习目标</h3>
          <div className="setting-item">
            <label>每日学习时长上限（分钟）</label>
            <input
              type="number"
              value={settings.dailyStudyTimeLimit}
              onChange={(e) => setSettings({...settings, dailyStudyTimeLimit: parseInt(e.target.value)})}
              min="10"
              max="180"
            />
          </div>
          <div className="setting-item">
            <label>每周学习单词目标</label>
            <input
              type="number"
              value={settings.weeklyWordsGoal}
              onChange={(e) => setSettings({...settings, weeklyWordsGoal: parseInt(e.target.value)})}
              min="10"
              max="200"
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>🔔 通知设置</h3>
          <div className="setting-item">
            <label>启用学习通知</label>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => setSettings({...settings, notificationsEnabled: e.target.checked})}
            />
          </div>
          <div className="setting-item">
            <label>通知时间</label>
            <input
              type="time"
              value={settings.notificationTime}
              onChange={(e) => setSettings({...settings, notificationTime: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>👁️ 监控权限</h3>
          <div className="setting-item">
            <label>启用学习监控</label>
            <input
              type="checkbox"
              checked={settings.monitorPermissions}
              onChange={(e) => setSettings({...settings, monitorPermissions: e.target.checked})}
            />
          </div>
          <div className="setting-item">
            <label>正确率监控阈值（%）</label>
            <input
              type="number"
              value={settings.accuracyThreshold}
              onChange={(e) => setSettings({...settings, accuracyThreshold: parseInt(e.target.value)})}
              min="50"
              max="100"
            />
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-btn" onClick={handleSaveSettings}>保存设置</button>
        </div>
      </div>
    </div>
  );
};

const getPeriodLabel = (periodType: string): string => {
  const labels: Record<string, string> = {
    'daily': '日报',
    'weekly': '周报',
    'monthly': '月报'
  };
  return labels[periodType] || periodType;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

export default ParentDashboard;
