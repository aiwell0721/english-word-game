"""
主题皮肤系统 - 数据库初始化
"""

import sqlite3
import json
from datetime import datetime

def init_themes_db(db_path: str):
    """初始化主题数据库"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 创建主题表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS themes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) NOT NULL,
            description TEXT,
            category VARCHAR(20) NOT NULL,  -- free, premium
            points_cost INTEGER NOT NULL,
            preview_url TEXT,
            css_config TEXT NOT NULL,  -- JSON格式
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 创建用户主题表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_themes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            theme_id INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT 0,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (theme_id) REFERENCES themes(id),
            UNIQUE(user_id, theme_id)
        )
    ''')

    # 插入默认主题
    themes_data = [
        {
            'name': '默认主题',
            'description': '清爽简洁的默认样式',
            'category': 'free',
            'points_cost': 0,
            'preview_url': '',
            'css_config': json.dumps({
                'primary_color': '#3b82f6',
                'secondary_color': '#10b981',
                'background_color': '#f3f4f6',
                'card_background': '#ffffff',
                'text_color': '#1f2937',
                'accent_color': '#6366f1',
                'button_radius': '8px',
                'font_family': 'system-ui, sans-serif'
            })
        },
        {
            'name': '动物主题',
            'description': '可爱的小熊和小兔子🐻🐰',
            'category': 'free',
            'points_cost': 0,
            'preview_url': '',
            'css_config': json.dumps({
                'primary_color': '#f59e0b',
                'secondary_color': '#10b981',
                'background_color': '#fef3c7',
                'card_background': '#ffffff',
                'text_color': '#451a03',
                'accent_color': '#fbbf24',
                'button_radius': '16px',
                'font_family': 'Comic Neue, cursive, sans-serif'
            })
        },
        {
            'name': '宇宙主题',
            'description': '神秘的星球和火箭🚀🌟',
            'category': 'free',
            'points_cost': 0,
            'preview_url': '',
            'css_config': json.dumps({
                'primary_color': '#8b5cf6',
                'secondary_color': '#06b6d4',
                'background_color': '#1e1b4b',
                'card_background': '#312e81',
                'text_color': '#e0e7ff',
                'accent_color': '#a78bfa',
                'button_radius': '12px',
                'font_family': 'Orbitron, monospace, sans-serif'
            })
        },
        {
            'name': '森林主题',
            'description': '清新的自然风格🌲🦋',
            'category': 'premium',
            'points_cost': 500,
            'preview_url': '',
            'css_config': json.dumps({
                'primary_color': '#059669',
                'secondary_color': '#84cc16',
                'background_color': '#ecfdf5',
                'card_background': '#ffffff',
                'text_color': '#064e3b',
                'accent_color': '#10b981',
                'button_radius': '12px',
                'font_family': 'Fredoka One, cursive, sans-serif'
            })
        },
        {
            'name': '海洋主题',
            'description': '深邃的海底世界🌊🐠',
            'category': 'premium',
            'points_cost': 800,
            'preview_url': '',
            'css_config': json.dumps({
                'primary_color': '#0ea5e9',
                'secondary_color': '#6366f1',
                'background_color': '#e0f2fe',
                'card_background': '#ffffff',
                'text_color': '#0c4a6e',
                'accent_color': '#38bdf8',
                'button_radius': '20px',
                'font_family': 'Nunito, sans-serif'
            })
        }
    ]

    # 检查是否已经有主题数据
    cursor.execute('SELECT COUNT(*) FROM themes')
    count = cursor.fetchone()[0]

    if count == 0:
        for theme in themes_data:
            cursor.execute('''
                INSERT INTO themes (name, description, category, points_cost, preview_url, css_config)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                theme['name'],
                theme['description'],
                theme['category'],
                theme['points_cost'],
                theme['preview_url'],
                theme['css_config']
            ))
        print(f"✅ 已插入 {len(themes_data)} 个默认主题")
    else:
        print(f"✅ 主题数据已存在（{count} 个）")

    conn.commit()
    conn.close()
    print("✅ 主题数据库初始化完成")

if __name__ == '__main__':
    import os
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
    init_themes_db(db_path)
