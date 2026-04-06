"""
家长管理系统 - 数据库表创建脚本
为现有数据库添加家长管理相关表
"""

import sqlite3
import os

# 数据库路径
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("👨 开始添加家长管理系统数据库表...\n")

# 1. 创建家长账户表
print("1. 创建家长账户表 (parents)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS parents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        username TEXT NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        relationship TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
''')
print("   ✅ parents 表创建成功")

# 2. 创建家长设置表
print("\n2. 创建家长设置表 (parent_settings)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS parent_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL UNIQUE,
        daily_time_limit INTEGER DEFAULT 60,
        weekly_word_goal INTEGER DEFAULT 50,
        enable_notifications BOOLEAN DEFAULT 1,
        notification_time TEXT DEFAULT '19:00',
        monitor_progress BOOLEAN DEFAULT 1,
        monitor_accuracy BOOLEAN DEFAULT 1,
        FOREIGN KEY (parent_id) REFERENCES parents(id)
    )
''')
print("   ✅ parent_settings 表创建成功")

# 3. 创建子学生关联表
print("\n3. 创建子学生关联表 (child_students)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS child_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL,
        child_user_id INTEGER NOT NULL UNIQUE,
        relationship TEXT NOT NULL,
        can_monitor BOOLEAN DEFAULT 1,
        can_set_time_limit BOOLEAN DEFAULT 1,
        can_receive_reports BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id),
        FOREIGN KEY (child_user_id) REFERENCES users(id)
    )
''')
print("   ✅ child_students 表创建成功")

# 4. 创建家长学习报告表
print("\n4. 创建家长学习报告表 (parent_reports)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS parent_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL,
        child_user_id INTEGER NOT NULL,
        report_type TEXT NOT NULL,
        report_data TEXT NOT NULL,
        report_date DATE NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id),
        FOREIGN KEY (child_user_id) REFERENCES users(id)
    )
''')
print("   ✅ parent_reports 表创建成功")

# 5. 创建学习监控记录表
print("\n5. 创建学习监控记录表 (learning_monitor)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS learning_monitor (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL,
        child_user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        activity_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES parents(id),
        FOREIGN KEY (child_user_id) REFERENCES users(id)
    )
''')
print("   ✅ learning_monitor 表创建成功")

# 6. 创建进度对比表
print("\n6. 创建进度对比表 (progress_comparison)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS progress_comparison (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_user_id INTEGER NOT NULL,
        comparison_type TEXT NOT NULL,
        child_value REAL NOT NULL,
        peer_average REAL NOT NULL,
        peer_top_percentile REAL,
        peer_bottom_percentile REAL,
        comparison_date DATE NOT NULL,
        FOREIGN KEY (child_user_id) REFERENCES users(id)
    )
''')
print("   ✅ progress_comparison 表创建成功")

# 提交更改
conn.commit()

print("\n" + "="*50)
print("✅ 所有家长管理系统表创建完成！")
print("="*50)

# 显示所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
print(f"\n当前数据库中共有 {len(tables)} 个表:")
for table in tables:
    print(f"  - {table[0]}")

conn.close()
