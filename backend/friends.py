"""
好友系统 - 数据库初始化
"""

import sqlite3

def init_friends_db(db_path: str):
    """初始化好友数据库"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 创建好友关系表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friendships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            status VARCHAR(20) NOT NULL,  -- pending, accepted, blocked
            request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            accepted_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, friend_id),
            CHECK (user_id != friend_id)  -- 不能添加自己为好友
        )
    ''')

    # 创建好友对战表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friend_battles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            battle_type VARCHAR(20) NOT NULL,  -- words, points, time
            user_score INTEGER NOT NULL,
            friend_score INTEGER NOT NULL,
            word_count INTEGER DEFAULT 10,
            duration_seconds INTEGER,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            winner_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (winner_id) REFERENCES users(id)
        )
    ''')

    # 创建社交分享表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS social_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            share_type VARCHAR(20) NOT NULL,  -- achievement, badge, milestone
            content TEXT NOT NULL,  -- JSON格式
            platform VARCHAR(50),  -- wechat, qq, weibo
            shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ 好友系统数据库初始化完成")

if __name__ == '__main__':
    import os
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
    init_friends_db(db_path)
