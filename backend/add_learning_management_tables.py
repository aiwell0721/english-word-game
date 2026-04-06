"""
学习管理系统 - 数据库表创建脚本
为现有数据库添加学习管理相关表
"""

import sqlite3
import os

# 数据库路径
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("📚 开始添加学习管理系统数据库表...\n")

# 1. 创建错题本表
print("1. 创建错题本表 (wrong_answers)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS wrong_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        user_answer TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        error_type TEXT,
        practice_count INTEGER DEFAULT 0,
        mastered BOOLEAN DEFAULT 0,
        first_mistake_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_practice_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (word_id) REFERENCES words(id),
        UNIQUE(user_id, word_id)
    )
''')
print("   ✅ wrong_answers 表创建成功")

# 2. 创建复习计划表
print("\n2. 创建复习计划表 (review_plans)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS review_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        word_id INTEGER NOT NULL,
        review_date DATE NOT NULL,
        stage INTEGER NOT NULL,
        interval_days INTEGER NOT NULL,
        ease_factor REAL DEFAULT 2.5,
        is_reviewed BOOLEAN DEFAULT 0,
        reviewed_at TIMESTAMP,
        is_correct BOOLEAN,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (word_id) REFERENCES words(id)
    )
''')
print("   ✅ review_plans 表创建成功")

# 3. 创建学习记录汇总表
print("\n3. 创建学习记录汇总表 (learning_summary)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS learning_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        total_learned INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        wrong_count INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        words_mastered INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, date)
    )
''')
print("   ✅ learning_summary 表创建成功")

# 4. 创建学习打卡表
print("\n4. 创建学习打卡表 (learning_checkin)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS learning_checkin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        checkin_date DATE NOT NULL,
        total_time INTEGER DEFAULT 0,
        session_count INTEGER DEFAULT 0,
        words_learned INTEGER DEFAULT 0,
        correct_rate REAL,
        checkin_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, checkin_date)
    )
''')
print("   ✅ learning_checkin 表创建成功")

# 5. 创建周报统计表
print("\n5. 创建周报统计表 (weekly_reports)...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS weekly_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        total_days INTEGER DEFAULT 0,
        total_time INTEGER DEFAULT 0,
        total_words INTEGER DEFAULT 0,
        correct_count INTEGER DEFAULT 0,
        wrong_count INTEGER DEFAULT 0,
        words_mastered INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, week_start)
    )
''')
print("   ✅ weekly_reports 表创建成功")

# 提交更改
conn.commit()

print("\n" + "="*50)
print("✅ 所有学习管理系统表创建完成！")
print("="*50)

# 显示所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cursor.fetchall()
print(f"\n当前数据库中共有 {len(tables)} 个表:")
for table in tables:
    print(f"  - {table[0]}")

conn.close()
