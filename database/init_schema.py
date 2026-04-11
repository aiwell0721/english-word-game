import sqlite3
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, 'word_game.db')
schema_path = os.path.join(script_dir, 'schema.sql')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

with open(schema_path, 'r', encoding='utf-8') as f:
    schema = f.read()
    cursor.executescript(schema)

conn.commit()

# 验证表创建
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cursor.fetchall()]
print(f"Database tables created! Total: {len(tables)} tables")
for table in tables:
    print(f"   - {table}")

conn.close()
