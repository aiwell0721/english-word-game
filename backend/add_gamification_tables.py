"""
游戏化系统 - 数据库表创建脚本
为现有数据库添加游戏化相关表
"""

import sqlite3
import os

# 数据库路径
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("🎮 开始添加游戏化系统数据库表...\n")

# 1. 创建用户积分表
print("1. 创建用户积分表 (user_points)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        total_points INTEGER DEFAULT 0,
        daily_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_streak_date DATE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
''')
print("   ✅ user_points 表创建成功")

# 2. 创建积分历史表
print("\n2. 创建积分历史表 (point_history)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS point_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        reason TEXT NOT NULL,
        related_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
''')
print("   ✅ point_history 表创建成功")

# 3. 创建成就定义表
print("\n3. 创建成就定义表 (achievements)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        icon TEXT,
        points_reward INTEGER NOT NULL,
        condition_type TEXT NOT NULL,
        condition_value INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("   ✅ achievements 表创建成功")

# 4. 创建用户成就表
print("\n4. 创建用户成就表 (user_achievements)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (achievement_id) REFERENCES achievements(id),
        UNIQUE(user_id, achievement_id)
    )
''')
print("   ✅ user_achievements 表创建成功")

# 5. 创建排行榜缓存表
print("\n5. 创建排行榜缓存表 (leaderboard)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        total_points INTEGER NOT NULL,
        rank INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
''')
print("   ✅ leaderboard 表创建成功")

# 6. 创建用户皮肤配置表
print("\n6. 创建用户皮肤配置表 (user_skins)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_skins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        avatar_id INTEGER DEFAULT 1,
        theme_id INTEGER DEFAULT 1,
        background_id INTEGER DEFAULT 1,
        unlocked_skins TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
''')
print("   ✅ user_skins 表创建成功")

# 7. 创建每日任务表
print("\n7. 创建每日任务表 (daily_tasks)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS daily_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        points_reward INTEGER NOT NULL,
        condition_type TEXT NOT NULL,
        condition_value INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1
    )
''')
print("   ✅ daily_tasks 表创建成功")

# 8. 创建用户每日任务表
print("\n8. 创建用户每日任务表 (user_daily_tasks)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_daily_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT 0,
        completed_at TIMESTAMP,
        date DATE NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (task_id) REFERENCES daily_tasks(id),
        UNIQUE(user_id, task_id, date)
    )
''')
print("   ✅ user_daily_tasks 表创建成功")

# 提交更改
conn.commit()

print("\n" + "="*50)
print("✅ 所有游戏化系统表创建完成！")
print("="*50)

# 显示所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
print(f"\n当前数据库中共有 {len(tables)} 个表:")
for table in tables:
    print(f"  - {table[0]}")

conn.close()
