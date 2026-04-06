"""
游戏化系统 - 初始化数据脚本
初始化成就定义和每日任务
"""

import sqlite3
import os

# 数据库路径
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("🎮 开始初始化游戏化数据...\n")

# 初始化成就定义
print("1. 初始化成就定义...")

achievements = [
    # 学习成就
    (1, "初学者", "完成第一次学习", "🌱", 50, "first_learn", 1),
    (2, "学习达人", "累计学习100个单词", "📚", 100, "total_words", 100),
    (3, "单词大师", "累计学习500个单词", "🎓", 500, "total_words", 500),
    (4, "词汇专家", "累计学习1000个单词", "🏆", 1000, "total_words", 1000),

    # 连胜成就
    (5, "坚持不懈", "连续学习3天", "🔥", 100, "streak", 3),
    (6, "学习狂人", "连续学习7天", "⚡", 200, "streak", 7),
    (7, "持之以恒", "连续学习30天", "🌟", 500, "streak", 30),

    # 正确率成就
    (8, "完美开始", "单次游戏正确率达到100%", "💯", 50, "perfect_game", 1),
    (9, "准确无误", "单次游戏正确率达到100%（10个单词）", "🎯", 150, "perfect_game", 10),

    # 等级成就
    (10, "升级达人", "达到等级5", "⬆️", 100, "level", 5),
    (11, "高手风范", "达到等级10", "👑", 300, "level", 10),
    (12, "学习传奇", "达到等级20", "🏅", 1000, "level", 20),

    # 时间成就
    (13, "早起鸟", "在早上6-8点完成学习", "🌅", 50, "early_bird", 1),
    (14, "夜猫子", "在晚上10-12点完成学习", "🌙", 50, "night_owl", 1),

    # 特殊成就
    (15, "闪电手", "单次游戏中平均响应时间<3秒", "⚡", 100, "fast_response", 1),
    (16, "错题克星", "成功复习所有错题", "✨", 200, "all_wrong_corrected", 1),
]

for achievement in achievements:
    cursor.execute('''
        INSERT OR IGNORE INTO achievements
        (id, name, description, icon, points_reward, condition_type, condition_value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', achievement)

print(f"   ✅ 成就定义初始化完成（{len(achievements)}个成就）")

# 初始化每日任务
print("\n2. 初始化每日任务...")

daily_tasks = [
    (1, "每日签到", "登录应用即可完成", 10, "daily_login", 1),
    (2, "学习5个单词", "完成5个单词的学习", 20, "daily_learn", 5),
    (3, "学习10个单词", "完成10个单词的学习", 40, "daily_learn", 10),
    (4, "获得3个星星", "在单次游戏中获得3星评价", 30, "daily_stars", 3),
    (5, "连续答对", "连续答对5个单词", 20, "daily_streak", 5),
    (6, "完美一局", "单次游戏正确率达到100%", 50, "daily_perfect", 1),
]

for task in daily_tasks:
    cursor.execute('''
        INSERT OR IGNORE INTO daily_tasks
        (id, name, description, points_reward, condition_type, condition_value)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', task)

print(f"   ✅ 每日任务初始化完成（{len(daily_tasks)}个任务）")

# 提交更改
conn.commit()

print("\n" + "="*50)
print("✅ 游戏化数据初始化完成！")
print("="*50)

# 显示成就列表
print("\n🏆 成就列表:")
cursor.execute("SELECT id, name, description, icon, points_reward FROM achievements ORDER BY id")
for row in cursor.fetchall():
    print(f"  {row[0]}. {row[3]} {row[1]} - {row[2]} (+{row[4]}分)")

# 显示每日任务列表
print("\n📋 每日任务列表:")
cursor.execute("SELECT id, name, description, points_reward FROM daily_tasks ORDER BY id")
for row in cursor.fetchall():
    print(f"  {row[0]}. {row[1]} - {row[2]} (+{row[3]}分)")

conn.close()
