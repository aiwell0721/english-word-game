#!/usr/bin/env python3
"""
导入Level 3-6词汇到数据库
"""

import sqlite3
import json

def import_words():
    # 连接数据库
    conn = sqlite3.connect('word_game.db')
    cursor = conn.cursor()

    # 读取词汇JSON文件
    with open('words_level_3_6.json', 'r', encoding='utf-8') as f:
        words_data = json.load(f)

    total_imported = 0

    # 导入每个级别的词汇
    for level_key in ['level3', 'level4', 'level5', 'level6']:
        level_num = int(level_key[-1])  # 提取级别数字

        if level_key in words_data:
            words = words_data[level_key]

            for word_data in words:
                cursor.execute('''
                    INSERT INTO words (word, phonetic, meaning, level, category, example, example_translation)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    word_data['word'],
                    word_data.get('phonetic', ''),
                    word_data['meaning'],
                    level_num,
                    word_data.get('category', ''),
                    word_data.get('example', ''),
                    word_data.get('example_translation', '')
                ))

                total_imported += 1
                print(f"✅ 导入: {word_data['word']} (Level {level_num})")

    # 提交事务
    conn.commit()

    # 验证导入结果
    cursor.execute('SELECT COUNT(*) FROM words')
    total_words = cursor.fetchone()[0]

    print(f"\n📊 导入统计:")
    print(f"   本次导入: {total_imported} 个词汇")
    print(f"   数据库总词汇: {total_words} 个")

    # 按级别统计
    print(f"\n📈 各级别统计:")
    for level in range(1, 7):
        cursor.execute('SELECT COUNT(*) FROM words WHERE level = ?', (level,))
        count = cursor.fetchone()[0]
        print(f"   Level {level}: {count} 个")

    # 关闭连接
    conn.close()

    print(f"\n✅ 词汇导入完成！")

if __name__ == '__main__':
    import_words()
