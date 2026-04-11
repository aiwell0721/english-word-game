#!/usr/bin/env python3
import sqlite3
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, 'word_game.db')
json_path = os.path.join(script_dir, 'words_level_3_6.json')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

with open(json_path, 'r', encoding='utf-8') as f:
    words_data = json.load(f)

total_imported = 0

for level_key in ['level3', 'level4', 'level5', 'level6']:
    level_num = int(level_key[-1])
    if level_key in words_data:
        for word_data in words_data[level_key]:
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

conn.commit()
cursor.execute('SELECT COUNT(*) FROM words')
print(f"Imported: {total_imported} words, Total in DB: {cursor.fetchone()[0]}")
conn.close()
