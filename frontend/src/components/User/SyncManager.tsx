import React, { useState, useEffect } from 'react';
import './SyncManager.css';

interface SyncStatus {
  device_id: string;
  synced_at: string;
  version: number;
}

interface SyncData {
  device_id: string;
  sync_data: any;
  synced_at: string;
  version: number;
}

export const SyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<{
    total_devices: number;
    last_sync_at: string;
    devices: SyncStatus[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/sync/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setSyncStatus(data.data);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load sync status:', error);
      setError('加载同步状态失败');
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccessMsg(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setSyncing(false);
        return;
      }

      // 收集本地数据
      const localData = {
        last_modified: Date.now(),
        user_profile: {
          username: localStorage.getItem('username'),
          grade_level: localStorage.getItem('grade_level')
        },
        learning_progress: {
          total_words: localStorage.getItem('total_words'),
          mastered_words: localStorage.getItem('mastered_words'),
          current_level: localStorage.getItem('current_level')
        },
        game_settings: {
          sound_enabled: localStorage.getItem('sound_enabled'),
          auto_play: localStorage.getItem('auto_play'),
          language: localStorage.getItem('language')
        },
        timestamp: new Date().toISOString()
      };

      // 生成设备ID
      const deviceId = generateDeviceId();

      const response = await fetch('http://localhost:5001/api/sync/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: localData,
          device_id: deviceId
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`✅ ${data.message} (版本 ${data.version})`);
        // 重新加载同步状态
        loadSyncStatus();
      } else {
        setError(data.error);
      }
      setSyncing(false);
    } catch (error) {
      console.error('Failed to upload sync data:', error);
      setError('上传数据失败');
      setSyncing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccessMsg(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setSyncing(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/sync/download', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        // 应用同步数据
        applySyncData(data.data.sync_data);
        setSuccessMsg(`✅ 数据同步完成 (版本 ${data.data.version})`);
        // 重新加载同步状态
        loadSyncStatus();
      } else {
        setError(data.error);
      }
      setSyncing(false);
    } catch (error) {
      console.error('Failed to download sync data:', error);
      setError('下载数据失败');
      setSyncing(false);
    }
  };

  const handleForceSync = async () => {
    if (!confirm('确定要强制同步数据吗？本地数据将被云端数据覆盖。')) {
      return;
    }

    await handleDownload();
  };

  const applySyncData = (syncData: any) => {
    if (syncData.user_profile) {
      if (syncData.user_profile.username) {
        localStorage.setItem('username', syncData.user_profile.username);
      }
      if (syncData.user_profile.grade_level) {
        localStorage.setItem('grade_level', syncData.user_profile.grade_level);
      }
    }

    if (syncData.learning_progress) {
      if (syncData.learning_progress.total_words) {
        localStorage.setItem('total_words', syncData.learning_progress.total_words);
      }
      if (syncData.learning_progress.mastered_words) {
        localStorage.setItem('mastered_words', syncData.learning_progress.mastered_words);
      }
      if (syncData.learning_progress.current_level) {
        localStorage.setItem('current_level', syncData.learning_progress.current_level);
      }
    }

    if (syncData.game_settings) {
      if (syncData.game_settings.sound_enabled !== undefined) {
        localStorage.setItem('sound_enabled', syncData.game_settings.sound_enabled);
      }
      if (syncData.game_settings.auto_play !== undefined) {
        localStorage.setItem('auto_play', syncData.game_settings.auto_play);
      }
      if (syncData.game_settings.language) {
        localStorage.setItem('language', syncData.game_settings.language);
      }
    }
  };

  const generateDeviceId = (): string => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const formatSyncTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <div className="sync-manager loading">
        <div className="loading-spinner"></div>
        <p>加载同步状态中...</p>
      </div>
    );
  }

  return (
    <div className="sync-manager">
      {/* 头部 */}
      <div className="sync-header">
        <h2>☁️ 多设备同步</h2>
        <div className="sync-summary">
          <span className="device-count">
            {syncStatus?.total_devices || 0} 个设备
          </span>
          {syncStatus?.last_sync_at && (
            <span className="last-sync">
              上次同步: {formatSyncTime(syncStatus.last_sync_at)}
            </span>
          )}
        </div>
      </div>

      {/* 错误/成功消息 */}
      {error && (
        <div className="message error">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="message success">
          {successMsg}
        </div>
      )}

      {/* 同步操作 */}
      <div className="sync-actions">
        <h3>同步操作</h3>
        <div className="action-buttons">
          <button
            className="sync-btn upload"
            onClick={handleUpload}
            disabled={syncing}
          >
            {syncing ? '⏳ 上传中...' : '☁️ 上传到云端'}
          </button>
          <button
            className="sync-btn download"
            onClick={handleDownload}
            disabled={syncing}
          >
            {syncing ? '⏳ 下载中...' : '⬇️ 从云端下载'}
          </button>
          <button
            className="sync-btn force"
            onClick={handleForceSync}
            disabled={syncing}
          >
            {syncing ? '⏳ 同步中...' : '🔄 强制同步'}
          </button>
        </div>
      </div>

      {/* 设备列表 */}
      {syncStatus && syncStatus.devices.length > 0 && (
        <div className="devices-list">
          <h3>已同步设备</h3>
          <div className="devices-grid">
            {syncStatus.devices.map((device, index) => (
              <div key={index} className="device-card">
                <div className="device-info">
                  <div className="device-icon">
                    {index === 0 ? '💻 本机' : '📱 其他设备'}
                  </div>
                  <div className="device-details">
                    <div className="device-id">
                      {device.device_id.substring(0, 20)}...
                    </div>
                    <div className="sync-time">
                      同步时间: {formatSyncTime(device.synced_at)}
                    </div>
                    <div className="sync-version">
                      版本: v{device.version}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 同步说明 */}
      <div className="sync-info">
        <h4>📖 关于同步</h4>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">☁️</div>
            <div className="info-content">
              <h5>上传到云端</h5>
              <p>将本地学习进度、设置、积分等数据上传到云端</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⬇️</div>
            <div className="info-content">
              <h5>从云端下载</h5>
              <p>将云端的最新数据下载到本地</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🔄</div>
            <div className="info-content">
              <h5>强制同步</h5>
              <p>用云端数据覆盖本地数据（谨慎使用）</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⚡</div>
            <div className="info-content">
              <h5>冲突解决</h5>
              <p>自动以最新修改时间为准，避免数据丢失</p>
            </div>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="sync-tips">
        <h4>💡 使用提示</h4>
        <ul>
          <li>建议每次学习结束后点击"上传到云端"</li>
          <li>更换设备后先点击"从云端下载"</li>
          <li>强制同步会覆盖本地数据，请谨慎使用</li>
          <li>系统会自动处理数据冲突，以最新数据为准</li>
        </ul>
      </div>
    </div>
  );
};
