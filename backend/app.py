"""
 - API
Flask RESTful API
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta, datetime
import os
import random

app = Flask(__name__)

# 
import os
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'word_game.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
}
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# 
CORS(app, origins='*')
db = SQLAlchemy(app, use_native_unicode=True)
jwt = JWTManager(app)

# 
class User(db.Model):
    """"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    grade_level = db.Column(db.Integer)  # 1-6
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    last_active = db.Column(db.DateTime)

class Word(db.Model):
    """"""
    __tablename__ = 'words'

    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    phonetic = db.Column(db.String(50))
    meaning = db.Column(db.Text, nullable=False)
    level = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(50))
    image_url = db.Column(db.Text)
    audio_url = db.Column(db.Text)
    example = db.Column(db.Text)
    example_translation = db.Column(db.Text)

class LearningRecord(db.Model):
    """"""
    __tablename__ = 'learning_records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    word_id = db.Column(db.Integer, db.ForeignKey('words.id'), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    response_time = db.Column(db.Integer)
    learning_time = db.Column(db.DateTime, default=db.func.current_timestamp())

    user = db.relationship('User', backref='learning_records')
    word = db.relationship('Word', backref='learning_records')

class GameSession(db.Model):
    """"""
    __tablename__ = 'game_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    mode = db.Column(db.String(20))  # spelling, choice, listening, matching
    level = db.Column(db.Integer)
    words_count = db.Column(db.Integer)
    correct_count = db.Column(db.Integer)
    started_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    completed_at = db.Column(db.DateTime)

# API
@app.route('/')
def index():
    """"""
    return jsonify({
        'status': 'success',
        'message': ' API',
        'version': '1.0.0'
    })

@app.route('/api/health')
def health():
    """"""
    return jsonify({'status': 'ok'})

@app.route('/api/words', methods=['GET'])
def get_words():
    """"""
    try:
        level = request.args.get('level', type=int)
        category = request.args.get('category')
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)

        query = Word.query
        if level:
            query = query.filter_by(level=level)
        if category:
            query = query.filter_by(category=category)

        words = query.offset(offset).limit(limit).all()

        return jsonify({
            'success': True,
            'data': [{
                'id': w.id,
                'word': w.word,
                'phonetic': w.phonetic,
                'meaning': w.meaning,
                'level': w.level,
                'category': w.category,
                'image_url': w.image_url,
                'audio_url': w.audio_url
            } for w in words]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/words/<int:word_id>', methods=['GET'])
def get_word(word_id):
    """"""
    try:
        word = Word.query.get(word_id)
        if not word:
            return jsonify({
                'success': False,
                'error': 'Word not found'
            }), 404

        return jsonify({
            'success': True,
            'data': {
                'id': word.id,
                'word': word.word,
                'phonetic': word.phonetic,
                'meaning': word.meaning,
                'level': word.level,
                'category': word.category,
                'image_url': word.image_url,
                'audio_url': word.audio_url,
                'example': word.example,
                'example_translation': word.example_translation
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/words/random', methods=['GET'])
def get_random_word():
    """"""
    try:
        level = request.args.get('level', 1, type=int)

        words = Word.query.filter_by(level=level).all()
        if not words:
            return jsonify({
                'success': False,
                'error': 'No words found for this level'
            }), 404

        word = random.choice(words)
        return jsonify({
            'success': True,
            'data': {
                'id': word.id,
                'word': word.word,
                'phonetic': word.phonetic,
                'meaning': word.meaning,
                'level': word.level,
                'category': word.category,
                'image_url': word.image_url,
                'audio_url': word.audio_url
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/register', methods=['POST'])
def register():
    """"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        grade_level = data.get('grade_level')

        # 
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username and password are required'
            }), 400

        # 
        user = User(
            username=username,
            password_hash=password,
            email=email,
            grade_level=grade_level
        )
        db.session.add(user)
        db.session.commit()

        # 
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'data': {
                'token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'grade_level': user.grade_level,
                    'created_at': user.created_at.isoformat()
                }
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/login', methods=['POST'])
def login():
    """"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        # 
        user = User.query.filter_by(username=username).first()
        if not user or user.password_hash != password:
            return jsonify({
                'success': False,
                'error': 'Invalid username or password'
            }), 401

        # 
        user.last_active = db.func.current_timestamp()
        db.session.commit()

        # 
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'grade_level': user.grade_level,
                    'created_at': user.created_at.isoformat()
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/users/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        return jsonify({
            'success': True,
            'data': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'grade_level': user.grade_level,
                'created_at': user.created_at.isoformat(),
                'last_active': user.last_active.isoformat() if user.last_active else None
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/record', methods=['POST'])
@jwt_required()
def record_learning():
    """"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        word_id = data.get('word_id')
        is_correct = data.get('is_correct')
        response_time = data.get('response_time')

        if not word_id:
            return jsonify({
                'success': False,
                'error': 'word_id is required'
            }), 400

        # 
        record = LearningRecord(
            user_id=user_id,
            word_id=word_id,
            is_correct=is_correct,
            response_time=response_time

        )
        db.session.add(record)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Learning record saved'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/stats', methods=['GET'])
@jwt_required()
def get_learning_stats():
    """"""
    try:
        user_id = get_jwt_identity()

        # 
        records = LearningRecord.query.filter_by(user_id=user_id).all()

        total_words = len(set(r.word_id for r in records))
        correct_count = sum(1 for r in records if r.is_correct)
        mastered_words = len([r.word_id for r in records if r.is_correct])        
        accuracy = (correct_count / len(records) * 100) if records else 0

        return jsonify({
            'success': True,
            'data': {
                'total_words': total_words,
                'mastered_words': mastered_words,
                'correct_count': correct_count,
                'total_attempts': len(records),
                'accuracy': round(accuracy, 2)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/game/session', methods=['POST'])
@jwt_required()
def create_game_session():
    """"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        mode = data.get('mode')
        level = data.get('level', 1)
        words_count = data.get('words_count', 5)

        session = GameSession(
            user_id=user_id,
            mode=mode,
            level=level,
            words_count=words_count,
            correct_count=0
        )
        db.session.add(session)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': {
                'session_id': session.id,
                'mode': mode,
                'level': level,
                'words_count': words_count
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/game/session/<int:session_id>/complete', methods=['POST'])
@jwt_required()
def complete_game_session(session_id):
    """"""
    try:
        session = GameSession.query.get(session_id)
        if not session:
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404

        session.completed_at = db.func.current_timestamp()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Game session completed'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ====================  API ====================

@app.route('/api/gamification/points', methods=['GET'])
@jwt_required()
def get_user_points():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        result = conn.execute(db.text('''
            SELECT total_points, daily_points, level, experience, streak
            FROM user_points WHERE user_id = ?
        '''), (user_id,)).fetchone()

        if not result:
            # 
            conn.execute(db.text('''
                INSERT INTO user_points (user_id, total_points, daily_points, level, experience, streak)
                VALUES (?, 0, 0, 1, 0, 0)
            '''), (user_id,))
            conn.commit()
            return jsonify({
                'success': True,
                'data': {
                    'total_points': 0,
                    'daily_points': 0,
                    'level': 1,
                    'experience': 0,
                    'streak': 0
                }
            })

        return jsonify({
            'success': True,
            'data': {
                'total_points': result[0] if result else 0,
                'daily_points': result[1] if result else 0,
                'level': result[2] if result else 1,
                'experience': result[3] if result else 0,
                'streak': result[4] if result else 0
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/points/add', methods=['POST'])
@jwt_required()
def add_points():
    """"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        points = data.get('points', 0)
        reason = data.get('reason', '')
        related_id = data.get('related_id')

        if points <= 0:
            return jsonify({
                'success': False,
                'error': 'Points must be positive'
            }), 400

        conn = db.engine.connect()

        # 
        conn.execute(db.text('''
            INSERT INTO user_points (user_id, total_points, daily_points, level, experience, streak)
            VALUES (?, 0, 0, 1, 0, 0)
            ON CONFLICT(user_id) DO UPDATE SET
                total_points = total_points + ?,
                daily_points = daily_points + ?,
                experience = experience + ?,
                updated_at = CURRENT_TIMESTAMP
        '''), (user_id, points, points, points, points))

        # 
        conn.execute(db.text('''
            INSERT INTO point_history (user_id, points, reason, related_id)
            VALUES (?, ?, ?, ?)
        '''), (user_id, points, reason, related_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Added {points} points'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/achievements', methods=['GET'])
@jwt_required()
def get_achievements():
    """"""
    try:
        conn = db.engine.connect()
        result = conn.execute(db.text('''
            SELECT id, name, description, icon, points_reward, condition_type, condition_value
            FROM achievements WHERE is_active = 1 ORDER BY id
        ''')).fetchall()

        achievements = [{
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'icon': row[3],
            'points_reward': row[4],
            'condition_type': row[5],
            'condition_value': row[6]
        } for row in result]

        return jsonify({
            'success': True,
            'data': achievements
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/achievements/my', methods=['GET'])
@jwt_required()
def get_my_achievements():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        result = conn.execute(db.text('''
            SELECT a.id, a.name, a.description, a.icon, a.points_reward, ua.unlocked_at
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
            WHERE a.is_active = 1
            ORDER BY a.id
        '''), (user_id,)).fetchall()

        achievements = [{
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'icon': row[3],
            'points_reward': row[4],
            'unlocked': row[5] is not None,
            'unlocked_at': row[5].isoformat() if row[5] else None
        } for row in result]

        return jsonify({
            'success': True,
            'data': achievements
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/achievements/unlock', methods=['POST'])
@jwt_required()
def unlock_achievement():
    """"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        achievement_id = data.get('achievement_id')

        if not achievement_id:
            return jsonify({
                'success': False,
                'error': 'achievement_id is required'
            }), 400

        conn = db.engine.connect()

        # 
        existing = conn.execute(db.text('''
            SELECT id FROM user_achievements
            WHERE user_id = ? AND achievement_id = ?
        '''), (user_id, achievement_id)).fetchone()

        if existing:
            return jsonify({
                'success': False,
                'error': 'Achievement already unlocked'
            }), 400

        # 
        conn.execute(db.text('''
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (?, ?)
        '''), (user_id, achievement_id))

        # 
        achievement = conn.execute(db.text('''
            SELECT points_reward FROM achievements WHERE id = ?
        '''), (achievement_id,)).fetchone()

        if achievement:
            points = achievement[0]
            # 
            conn.execute(db.text('''
                INSERT INTO user_points (user_id, total_points, daily_points, level, experience, streak)
                VALUES (?, 0, 0, 1, 0, 0)
                ON CONFLICT(user_id) DO UPDATE SET
                    total_points = total_points + ?,
                    daily_points = daily_points + ?,
                    experience = experience + ?,
                    updated_at = CURRENT_TIMESTAMP
            '''), (user_id, points, points, points, points))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Achievement unlocked',
            'points_reward': points
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/leaderboard', methods=['GET'])
def get_leaderboard():
    """"""
    try:
        import datetime
        limit = request.args.get('limit', 10, type=int)
        period = request.args.get('period', 'all')  # all, week, month
        user_id = request.args.get('user_id', type=int)

        conn = db.engine.connect()

        # 
        if period == 'week':
            # 
            week_start = (datetime.date.today() - datetime.timedelta(days=datetime.date.today().weekday())).isoformat()
            result = conn.execute(db.text('''
                SELECT u.username, SUM(ph.points) as period_points, up.level, up.streak
                FROM point_history ph
                JOIN users u ON ph.user_id = u.id
                LEFT JOIN user_points up ON ph.user_id = up.user_id
                WHERE ph.created_at >= ?
                GROUP BY ph.user_id, u.username, up.level, up.streak
                ORDER BY period_points DESC
                LIMIT ?
            '''), (week_start, limit)).fetchall()
        elif period == 'month':
            # 
            month_start = datetime.date.today().replace(day=1).isoformat()
            result = conn.execute(db.text('''
                SELECT u.username, SUM(ph.points) as period_points, up.level, up.streak
                FROM point_history ph
                JOIN users u ON ph.user_id = u.id
                LEFT JOIN user_points up ON ph.user_id = up.user_id
                WHERE ph.created_at >= ?
                GROUP BY ph.user_id, u.username, up.level, up.streak
                ORDER BY period_points DESC
                LIMIT ?
            '''), (month_start, limit)).fetchall()
        else:
            # 
            result = conn.execute(db.text('''
                SELECT u.username, up.total_points, up.level, up.streak
                FROM user_points up
                JOIN users u ON up.user_id = u.id
                ORDER BY up.total_points DESC
                LIMIT ?
            '''), (limit,)).fetchall()

        leaderboard = [{
            'rank': i + 1,
            'username': row[0],
            'points': row[1],
            'level': row[2],
            'streak': row[3]
        } for i, row in enumerate(result)]

        # user_id
        my_rank = None
        if user_id:
            if period == 'week':
                my_result = conn.execute(db.text('''
                    SELECT COUNT(*) + 1 as rank FROM (
                        SELECT ph.user_id, SUM(ph.points) as period_points
                        FROM point_history ph
                        WHERE ph.created_at >= ?
                        GROUP BY ph.user_id
                        HAVING SUM(ph.points) > (
                            SELECT SUM(ph2.points)
                            FROM point_history ph2
                            WHERE ph2.user_id = ? AND ph2.created_at >= ?
                        )
                    ) AS higher
                '''), (week_start, user_id, week_start)).fetchone()
                my_rank = my_result[0] if my_result else None
            elif period == 'month':
                my_result = conn.execute(db.text('''
                    SELECT COUNT(*) + 1 as rank FROM (
                        SELECT ph.user_id, SUM(ph.points) as period_points
                        FROM point_history ph
                        WHERE ph.created_at >= ?
                        GROUP BY ph.user_id
                        HAVING SUM(ph.points) > (
                            SELECT SUM(ph2.points)
                            FROM point_history ph2
                            WHERE ph2.user_id = ? AND ph2.created_at >= ?
                        )
                    ) AS higher
                '''), (month_start, user_id, month_start)).fetchone()
                my_rank = my_result[0] if my_result else None
            else:
                my_result = conn.execute(db.text('''
                    SELECT COUNT(*) + 1 as rank FROM user_points
                    WHERE total_points > (SELECT total_points FROM user_points WHERE user_id = ?)
                '''), (user_id,)).fetchone()
                my_rank = my_result[0] if my_result else None

        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'leaderboard': leaderboard,
                'my_rank': my_rank
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/leaderboard/friends', methods=['GET'])
@jwt_required()
def get_friends_leaderboard():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        period = request.args.get('period', 'all')  # all, week, month
        limit = request.args.get('limit', 20, type=int)

        conn = db.engine.connect()

        # 
        friends = conn.execute(db.text('''
            SELECT friend_id FROM friendships 
            WHERE user_id = ? OR friend_id = ?
        '''), (user_id, user_id)).fetchall()

        if not friends:
            return jsonify({
                'success': True,
                'data': {
                    'message': '',
                    'leaderboard': []
                }
            })

        friend_ids = [row[0] for row in friends] + [user_id]

        # 
        if period == 'week':
            week_start = (datetime.date.today() - datetime.timedelta(days=datetime.date.today().weekday())).isoformat()
            result = conn.execute(db.text('''
                SELECT u.username, SUM(ph.points) as period_points, up.level, up.streak
                FROM point_history ph
                JOIN users u ON ph.user_id = u.id
                LEFT JOIN user_points up ON ph.user_id = up.user_id
                WHERE ph.created_at >= ? AND ph.user_id IN ({})
                GROUP BY ph.user_id, u.username, up.level, up.streak
                ORDER BY period_points DESC
                LIMIT ?
            ''').format(','.join(['?' for _ in friend_ids])), [week_start] + friend_ids + [limit]).fetchall()
        elif period == 'month':
            month_start = datetime.date.today().replace(day=1).isoformat()
            result = conn.execute(db.text('''
                SELECT u.username, SUM(ph.points) as period_points, up.level, up.streak
                FROM point_history ph
                JOIN users u ON ph.user_id = u.id
                LEFT JOIN user_points up ON ph.user_id = up.user_id
                WHERE ph.created_at >= ? AND ph.user_id IN ({})
                GROUP BY ph.user_id, u.username, up.level, up.streak
                ORDER BY period_points DESC
                LIMIT ?
            ''').format(','.join(['?' for _ in friend_ids])), [month_start] + friend_ids + [limit]).fetchall()
        else:
            result = conn.execute(db.text('''
                SELECT u.username, up.total_points, up.level, up.streak
                FROM user_points up
                JOIN users u ON up.user_id = u.id
                WHERE up.user_id IN ({})
                ORDER BY up.total_points DESC
                LIMIT ?
            ''').format(','.join(['?' for _ in friend_ids])), friend_ids + [limit]).fetchall()

        leaderboard = [{
            'rank': i + 1,
            'username': row[0],
            'points': row[1],
            'level': row[2],
            'streak': row[3]
        } for i, row in enumerate(result)]

        return jsonify({
            'success': True,
            'data': {
                'period': period,
                'leaderboard': leaderboard
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/daily-tasks', methods=['GET'])
@jwt_required()
def get_daily_tasks():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        today = datetime.date.today()

        conn = db.engine.connect()

        # 
        tasks = conn.execute(db.text('''
            SELECT dt.id, dt.name, dt.description, dt.points_reward,
                   dt.condition_type, dt.condition_value,
                   udt.progress, udt.is_completed, udt.completed_at
            FROM daily_tasks dt
            LEFT JOIN user_daily_tasks udt ON dt.id = udt.task_id
                AND udt.user_id = ? AND udt.date = ?
            WHERE dt.is_active = 1
            ORDER BY dt.id
        '''), (user_id, today.isoformat())).fetchall()

        task_list = [{
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'points_reward': row[3],
            'condition_type': row[4],
            'condition_value': row[5],
            'progress': row[6] or 0,
            'is_completed': row[7] or False,
            'completed_at': row[8].isoformat() if row[8] else None
        } for row in tasks]

        return jsonify({
            'success': True,
            'data': task_list,
            'date': today.isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gamification/daily-tasks/<int:task_id>/progress', methods=['POST'])
@jwt_required()
def update_task_progress(task_id):
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        data = request.get_json()
        progress = data.get('progress', 1)

        today = datetime.date.today()
        conn = db.engine.connect()

        # 
        task = conn.execute(db.text('''
            SELECT condition_value FROM daily_tasks WHERE id = ?
        '''), (task_id,)).fetchone()

        if not task:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404

        condition_value = task[0]

        # 
        conn.execute(db.text('''
            INSERT INTO user_daily_tasks (user_id, task_id, progress, date)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, task_id, date) DO UPDATE SET
                progress = progress + ?,
                is_completed = CASE WHEN progress + ? >= ? THEN 1 ELSE is_completed END,
                completed_at = CASE WHEN progress + ? >= ? AND is_completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END
        '''), (user_id, task_id, progress, today.isoformat(), progress, progress, condition_value, progress, condition_value))

        # 
        updated = conn.execute(db.text('''
            SELECT is_completed FROM user_daily_tasks
            WHERE user_id = ? AND task_id = ? AND date = ?
        '''), (user_id, task_id, today.isoformat())).fetchone()

        is_completed = updated[0] if updated else False

        # 
        if is_completed:
            task_info = conn.execute(db.text('''
                SELECT points_reward FROM daily_tasks WHERE id = ?
            '''), (task_id,)).fetchone()

            if task_info:
                points = task_info[0]
                conn.execute(db.text('''
                    INSERT INTO user_points (user_id, total_points, daily_points, level, experience, streak)
                    VALUES (?, 0, 0, 1, 0, 0)
                    ON CONFLICT(user_id) DO UPDATE SET
                        total_points = total_points + ?,
                        daily_points = daily_points + ?,
                        experience = experience + ?,
                        updated_at = CURRENT_TIMESTAMP
                '''), (user_id, points, points, points, points))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Task progress updated',
            'is_completed': is_completed
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ====================  API ====================

@app.route('/api/learning/wrong-answers', methods=['GET'])
@jwt_required()
def get_wrong_answers():
    """"""
    try:
        user_id = get_jwt_identity()
        mastered = request.args.get('mastered', 'false', type=bool)
        limit = request.args.get('limit', 20, type=int)

        conn = db.engine.connect()

        query = '''
            SELECT wa.id, w.word, w.meaning, w.level,
                   wa.user_answer, wa.correct_answer,
                   wa.error_type, wa.practice_count,
                   wa.mastered, wa.first_mistake_at, wa.last_practice_at
            FROM wrong_answers wa
            JOIN words w ON wa.word_id = w.id
            WHERE wa.user_id = ?
        '''
        params = [user_id]

        if mastered is not None:
            query += ' AND wa.mastered = ?'
            params.append(mastered)

        query += ' ORDER BY wa.first_mistake_at DESC LIMIT ?'
        params.append(limit)

        result = conn.execute(db.text(query), params).fetchall()

        wrong_answers = []
        for row in result:
            wrong_answers.append({
                'id': row['id'],
                'word': row['word'],
                'meaning': row['meaning'],
                'level': row['level'],
                'user_answer': row['user_answer'],
                'correct_answer': row['correct_answer'],
                'error_type': row['error_type'],
                'practice_count': row['practice_count'],
                'mastered': row['mastered'],
                'first_mistake_at': str(row['first_mistake_at']) if row['first_mistake_at'] else None,
                'last_practice_at': str(row['last_practice_at']) if row['last_practice_at'] else None
            })

        return jsonify({
            'success': True,
            'data': wrong_answers
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/wrong-answers', methods=['POST'])
@jwt_required()
def add_wrong_answer():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        data = request.get_json()
        word_id = data.get('word_id')
        user_answer = data.get('user_answer')
        correct_answer = data.get('correct_answer')
        error_type = data.get('error_type', 'wrong')

        if not word_id or not user_answer:
            return jsonify({
                'success': False,
                'error': 'word_id and user_answer are required'
            }), 400

        conn = db.engine.connect()

        # 
        word = conn.execute(db.text('''
            SELECT word FROM words WHERE id = ?
        '''), (word_id,)).fetchone()

        if word:
            correct_answer = word[0]

        # 
        conn.execute(db.text('''
            INSERT INTO wrong_answers (user_id, word_id, user_answer, correct_answer, error_type)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id, word_id) DO UPDATE SET
                user_answer = ?,
                correct_answer = ?,
                error_type = ?,
                practice_count = practice_count + 1,
                last_practice_at = CURRENT_TIMESTAMP
        '''), (user_id, word_id, user_answer, correct_answer, error_type,
                 user_answer, correct_answer, error_type))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Wrong answer recorded'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/review-ans', methods=['GET'])
@jwt_required()
def get_review_plans():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        today = datetime.date.today()

        conn = db.engine.connect()

        result = conn.execute(db.text('''
            SELECT rp.id, w.word, w.meaning, w.level,
                   rp.review_date, rp.stage, rp.interval_days,
                   rp.ease_factor, rp.is_reviewed, rp.reviewed_at, rp.is_correct
            FROM review_plans rp
            JOIN words w ON rp.word_id = w.id
            WHERE rp.user_id = ? AND rp.review_date <= ?
            ORDER BY rp.review_date
        '''), (user_id, today.isoformat())).fetchall()

        review_plans = [{
            'id': row[0],
            'word': row[1],
            'meaning': row[2],
            'level': row[3],
            'review_date': row[4],
            'stage': row[5],
            'interval_days': row[6],
            'ease_factor': row[7],
            'is_reviewed': row[8],
            'reviewed_at': row[9].isoformat() if row[9] else None,
            'is_correct': row[10]
        } for row in result]

        return jsonify({
            'success': True,
            'data': review_plans,
            'date': today.isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/review-ans', methods=['POST'])
@jwt_required()
def create_review_plan():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        data = request.get_json()
        word_id = data.get('word_id')
        is_correct = data.get('is_correct', True)

        if not word_id:
            return jsonify({
                'success': False,
                'error': 'word_id is required'
            }), 400

        conn = db.engine.connect()

        # 
        existing = conn.execute(db.text('''
            SELECT stage, interval_days, ease_factor FROM review_plans
            WHERE user_id = ? AND word_id = ?
        '''), (user_id, word_id)).fetchone()

        today = datetime.date.today()

        if existing:
            # SM-2
            stage, interval_days, ease_factor = existing

            if is_correct:
                # 
                ease_factor = max(1.3, ease_factor + 0.1)
                interval_days = int(interval_days * ease_factor)
                stage += 1
            else:
                # 
                ease_factor = max(1.3, ease_factor - 0.2)
                interval_days = max(1, int(interval_days * 0.5))
                stage = max(1, stage - 1)

            next_review_date = today + datetime.timedelta(days=interval_days)

            conn.execute(db.text('''
                UPDATE review_plans SET
                    review_date = ?,
                    stage = ?,
                    interval_days = ?,
                    ease_factor = ?,
                    is_reviewed = 1,
                    reviewed_at = CURRENT_TIMESTAMP,
                    is_correct = ?
                WHERE user_id = ? AND word_id = ?
            '''), (next_review_date.isoformat(), stage, interval_days,
                     ease_factor, is_correct, user_id, word_id))
        else:
            # 
            if is_correct:
                interval_days = 1
                stage = 1
            else:
                interval_days = 1
                stage = 0

            next_review_date = today + datetime.timedelta(days=interval_days)

            conn.execute(db.text('''
                INSERT INTO review_plans
                (user_id, word_id, review_date, stage, interval_days,
                 ease_factor, is_reviewed, reviewed_at, is_correct)
                VALUES (?, ?, ?, ?, ?, 2.5, 1, CURRENT_TIMESTAMP, ?)
            '''), (user_id, word_id, next_review_date.isoformat(),
                     stage, interval_days, is_correct))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Review plan updated',
            'next_review_date': next_review_date.isoformat(),
            'interval_days': interval_days
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/checkin', methods=['GET'])
@jwt_required()
def get_checkin_stats():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        days = request.args.get('days', 7, type=int)

        conn = db.engine.connect()
        start_date = (datetime.date.today() - datetime.timedelta(days=days)).isoformat()

        result = conn.execute(db.text('''
            SELECT checkin_date, total_time, session_count,
                   words_learned, correct_rate
            FROM learning_checkin
            WHERE user_id = ? AND checkin_date >= ?
            ORDER BY checkin_date DESC
        '''), (user_id, start_date)).fetchall()

        checkins = [{
            'date': row[0],
            'total_time': row[1],
            'session_count': row[2],
            'words_learned': row[3],
            'correct_rate': row[4]
        } for row in result]

        # 
        streak_result = conn.execute(db.text('''
            SELECT COUNT(*) as streak_count FROM learning_checkin
            WHERE user_id = ?
        '''), (user_id,)).fetchone()

        streak = streak_result[0] if streak_result else 0

        return jsonify({
            'success': True,
            'data': {
                'checkins': checkins,
                'streak': streak
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/checkin', methods=['POST'])
@jwt_required()
def checkin():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()
        data = request.get_json()
        total_time = data.get('total_time', 0)
        session_count = data.get('session_count', 1)
        words_learned = data.get('words_learned', 0)
        correct_rate = data.get('correct_rate', 0)

        today = datetime.date.today()
        conn = db.engine.connect()

        # 
        conn.execute(db.text('''
            INSERT INTO learning_checkin
            (user_id, checkin_date, total_time, session_count,
             words_learned, correct_rate)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, checkin_date) DO UPDATE SET
                total_time = total_time + ?,
                session_count = session_count + ?,
                words_learned = words_learned + ?,
                correct_rate = ?,
                checkin_at = CURRENT_TIMESTAMP
        '''), (user_id, today.isoformat(), total_time, session_count,
                 words_learned, correct_rate, total_time, session_count,
                 words_learned, correct_rate))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Checkin recorded',
            'date': today.isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/weekly-report', methods=['GET'])
@jwt_required()
def get_weekly_report():
    """"""
    try:
        import datetime
        user_id = get_jwt_identity()

        # 
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())
        week_end = week_start + datetime.timedelta(days=6)

        conn = db.engine.connect()

        # 
        report = conn.execute(db.text('''
            SELECT total_days, total_time, total_words,
                   correct_count, wrong_count, words_mastered, streak_days
            FROM weekly_reports
            WHERE user_id = ? AND week_start = ?
        '''), (user_id, week_start.isoformat())).fetchone()

        if not report:
            # 
            result = conn.execute(db.text('''
                SELECT COUNT(*) as total_days,
                       SUM(total_time) as total_time,
                       SUM(words_learned) as total_words,
                       SUM(session_count) as total_sessions
                FROM learning_checkin
                WHERE user_id = ? AND checkin_date >= ?
            '''), (user_id, week_start.isoformat())).fetchone()

            total_days, total_time, total_words, total_sessions = result if result else (0, 0, 0, 0)

            # 
            correct_count = conn.execute(db.text('''
                SELECT COUNT(*) FROM learning_records
                WHERE user_id = ? AND learning_time >= ?
            '''), (user_id, week_start.isoformat())).fetchone()

            return jsonify({
                'success': True,
                'data': {
                    'week_start': week_start.isoformat(),
                    'week_end': week_end.isoformat(),
                    'total_days': total_days,
                    'total_time': total_time,
                    'total_words': total_words,
                    'total_sessions': total_sessions,
                    'is_generated': True
                }
            })

        return jsonify({
            'success': True,
            'data': {
                'week_start': week_start.isoformat(),
                'week_end': week_end.isoformat(),
                'total_days': report[0],
                'total_time': report[1],
                'total_words': report[2],
                'correct_count': report[3],
                'wrong_count': report[4],
                'words_mastered': report[5],
                'streak_days': report[6],
                'is_generated': False
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # 
    with app.app_context():
        db.create_all()

    print(" ")
    print(" Flask...")
    print(" API:")
    print("  :")
    print("  - GET  /")
    print("  - GET  /api/health")
    print("  :")
    print("  - GET  /api/words")
    print("  - GET  /api/words/<id>")
    print("  - GET  /api/words/random")
    print("  :")
    print("  - POST /api/users/register")
    print("  - POST /api/users/login")
    print("  - GET  /api/users/profile")
    print("  :")
    print("  - POST /api/learning/record")
    print("  - GET  /api/learning/stats")
    print("  - GET  /api/learning/wrong-answers")
    print("  - POST /api/learning/wrong-answers")
    print("  - GET  /api/learning/review-plans")
    print("  - POST /api/learning/review-plans")
    print("  - GET  /api/learning/checkin")
    print("  - POST /api/learning/checkin")
    print("  - GET  /api/learning/weekly-report")
    print("  :")
    print("  - POST /api/game/session")
    print("  - POST /api/game/session/<id>/complete")
    print("  :")
    print("  - GET  /api/gamification/points")
    print("  - POST /api/gamification/points/add")
    print("  - GET  /api/gamification/achievements")
    print("  - GET  /api/gamification/achievements/my")
    print("  - POST /api/gamification/achievements/unlock")
    print("  - GET  /api/gamification/leaderboard")
    print("  - GET  /api/gamification/daily-tasks")
    print("  - POST /api/gamification/daily-tasks/<id>/progress")
    print("  :")
    print("  - POST /api/parent/register")
    print("  - POST /api/parent/login")
    print("  - GET  /api/parent/settings")
    print("  - PUT  /api/parent/settings")
    print("  - GET  /api/parent/children")
    print("  - GET  /api/parent/monitor/<child_user_id>")
    print("  - GET  /api/parent/reports")
    print("  - POST /api/parent/reports/<report_id>/read")
    print("  - GET  /api/parent/comparison/<child_user_id>")

    app.run(host='0.0.0.0', port=5001, debug=True)
# ====================  API ====================

@app.route('/api/themes', methods=['GET'])
def get_themes():
    """"""
    try:
        conn = db.engine.connect()
        result = conn.execute(db.text('''
            SELECT id, name, description, category, points_cost,
                   preview_url, css_config
            FROM themes WHERE is_active = 1 ORDER BY id
        ''')).fetchall()

        import json
        themes = [{
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'category': row[3],
            'points_cost': row[4],
            'preview_url': row[5],
            'css_config': json.loads(row[6])
        } for row in result]

        return jsonify({
            'success': True,
            'data': themes
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/themes/my', methods=['GET'])
@jwt_required()
def get_my_themes():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()
        
        result = conn.execute(db.text('''
            SELECT t.id, t.name, t.description, t.category, t.points_cost,
                   t.preview_url, t.css_config, ut.is_active, ut.unlocked_at
            FROM themes t
            JOIN user_themes ut ON t.id = ut.theme_id
            WHERE ut.user_id = ? AND t.is_active = 1
            ORDER BY ut.unlocked_at DESC
        '''), (user_id,)).fetchall()

        import json
        themes = [{
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'category': row[3],
            'points_cost': row[4],
            'preview_url': row[5],
            'css_config': json.loads(row[6]),
            'is_active': row[7],
            'unlocked_at': row[8].isoformat() if row[8] else None
        } for row in result]

        return jsonify({
            'success': True,
            'data': themes
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/themes/my/active', methods=['GET'])
@jwt_required()
def get_active_theme():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()
        
        result = conn.execute(db.text('''
            SELECT t.id, t.name, t.description, t.css_config
            FROM themes t
            JOIN user_themes ut ON t.id = ut.theme_id
            WHERE ut.user_id = ? AND ut.is_active = 1
        '''), (user_id,)).fetchone()

        if not result:
            # 
            result = conn.execute(db.text('''
                SELECT id, name, description, css_config
                FROM themes WHERE category = 'free' ORDER BY id LIMIT 1
            ''')).fetchone()

        import json
        return jsonify({
            'success': True,
            'data': {
                'id': result[0] if result else None,
                'name': result[1] if result else '',
                'description': result[2] if result else '',
                'css_config': json.loads(result[3]) if result and result[3] else {}
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/themes/<int:theme_id>/unlock', methods=['POST'])
@jwt_required()
def unlock_theme(theme_id):
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        theme = conn.execute(db.text('''
            SELECT name, category, points_cost FROM themes WHERE id = ?
        '''), (theme_id,)).fetchone()

        if not theme:
            return jsonify({
                'success': False,
                'error': 'Theme not found'
            }), 404

        # 
        existing = conn.execute(db.text('''
            SELECT id FROM user_themes WHERE user_id = ? AND theme_id = ?
        '''), (user_id, theme_id)).fetchone()

        if existing:
            return jsonify({
                'success': False,
                'error': 'Theme already unlocked'
            }), 400

        theme_name, category, points_cost = theme

        # 
        if category == 'premium':
            user_points = conn.execute(db.text('''
                SELECT total_points FROM user_points WHERE user_id = ?
            '''), (user_id,)).fetchone()

            if not user_points or user_points[0] < points_cost:
                return jsonify({
                    'success': False,
                    'error': f'Insufficient points. Need {points_cost} points',
                    'required_points': points_cost
                }), 400

            # 
            conn.execute(db.text('''
                INSERT INTO user_points (user_id, total_points, daily_points, level, experience, streak)
                VALUES (?, 0, 0, 1, 0, 0)
                ON CONFLICT(user_id) DO UPDATE SET
                    total_points = total_points - ?,
                    updated_at = CURRENT_TIMESTAMP
            '''), (user_id, points_cost))

            # 
            conn.execute(db.text('''
                INSERT INTO point_history (user_id, points, reason, related_id)
                VALUES (?, ?, ?, ?)
            '''), (user_id, -points_cost, f'Unlock theme: {theme_name}', theme_id))

        # 
        conn.execute(db.text('''
            INSERT INTO user_themes (user_id, theme_id, is_active)
            VALUES (?, ?, ?)
        '''), (user_id, theme_id, 1 if category == 'free' else 0))

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'Theme {theme_name} unlocked successfully',
            'data': {
                'theme_id': theme_id,
                'name': theme_name,
                'category': category,
                'points_cost': points_cost if category == 'premium' else 0
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/themes/<int:theme_id>/activate', methods=['POST'])
@jwt_required()
def activate_theme(theme_id):
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        unlocked = conn.execute(db.text('''
            SELECT id FROM user_themes WHERE user_id = ? AND theme_id = ?
        '''), (user_id, theme_id)).fetchone()

        if not unlocked:
            return jsonify({
                'success': False,
                'error': 'Theme not unlocked'
            }), 400

        # 
        conn.execute(db.text('''
            UPDATE user_themes SET is_active = 0 WHERE user_id = ?
        '''), (user_id,))

        # 
        conn.execute(db.text('''
            UPDATE user_themes SET is_active = 1 
            WHERE user_id = ? AND theme_id = ?
        '''), (user_id, theme_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Theme activated successfully'
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ====================  API ====================

@app.route('/api/sync/upload', methods=['POST'])
@jwt_required()
def sync_upload():
    """"""
    try:
        import json
        user_id = get_jwt_identity()
        data = request.get_json()
        sync_data = data.get('data')
        device_id = data.get('device_id', 'unknown')

        if not sync_data:
            return jsonify({
                'success': False,
                'error': 'Sync data is required'
            }), 400

        conn = db.engine.connect()

        # 
        existing = conn.execute(db.text('''
            SELECT id, device_id, sync_data, synced_at, version
            FROM user_sync WHERE user_id = ?
        '''), (user_id,)).fetchone()

        if existing:
            # 
            if 'last_modified' in sync_data:
                # 
                existing_data = json.loads(existing[2])
                
                # 
                if sync_data.get('last_modified') > existing_data.get('last_modified', 0):
                    conn.execute(db.text('''
                        UPDATE user_sync SET
                            sync_data = ?,
                            device_id = ?,
                            synced_at = CURRENT_TIMESTAMP,
                            version = version + 1
                        WHERE user_id = ?
                    '''), (json.dumps(sync_data), device_id, user_id))
                    
                    return jsonify({
                        'success': True,
                        'message': 'Sync data uploaded (updated)',
                        'version': existing[3] + 1
                    })
                else:
                    # 
                    return jsonify({
                        'success': False,
                        'error': 'Conflict: Server data is newer',
                        'server_data': existing_data,
                        'client_data': sync_data
                    }), 409
        else:
            # 
            conn.execute(db.text('''
                INSERT INTO user_sync (user_id, device_id, sync_data, synced_at, version)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
            '''), (user_id, device_id, json.dumps(sync_data)))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Sync data uploaded successfully',
            'version': existing[3] + 1 if existing else 1
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sync/download', methods=['GET'])
@jwt_required()
def sync_download():
    """"""
    try:
        import json
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        result = conn.execute(db.text('''
            SELECT device_id, sync_data, synced_at, version
            FROM user_sync WHERE user_id = ?
            ORDER BY synced version DESC LIMIT 1
        '''), (user_id,)).fetchone()

        if not result:
            return jsonify({
                'success': False,
                'error': 'No sync data found'
            }), 404

        device_id, sync_data, synced_at, version = result

        return jsonify({
            'success': True,
            'data': {
                'device_id': device_id,
                'sync_data': json.loads(sync_data),
                'synced_at': synced_at.isoformat() if synced_at else None,
                'version': version
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/sync/status', methods=['GET'])
@jwt_required()
def sync_status():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        result = conn.execute(db.text('''
            SELECT device_id, synced_at, version
            FROM user_sync WHERE user_id = ?
            ORDER BY synced_at DESC
        '''), (user_id,)).fetchall()

        syncs = [{
            'device_id': row[0],
            'synced_at': row[1].isoformat() if row[1] else None,
            'version': row[2]
        } for row in result]

        return jsonify({
            'success': True,
            'data': {
                'total_devices': len(syncs),
                'last_sync_at': syncs[0]['synced_at'] if syncs else None,
                'devices': syncs
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ====================  API ====================

@app.route('/api/friends/search', methods=['GET'])
@jwt_required()
def search_friends():
    """"""
    try:
        user_id = get_jwt_identity()
        keyword = request.args.get('keyword', '')
        limit = request.args.get('limit', 10, type=int)

        if not keyword:
            return jsonify({
                'success': False,
                'error': 'keyword is required'
            }), 400

        conn = db.engine.connect()

        # 
        result = conn.execute(db.text('''
            SELECT id, username, grade_level, created_at
            FROM users
            WHERE username LIKE ? AND id != ?
            AND id NOT IN (
                SELECT CASE 
                    WHEN user_id = ? THEN friend_id 
                    ELSE user_id 
                END 
                FROM friendships 
                WHERE user_id = ? OR friend_id = ?
            )
            ORDER BY created_at DESC
            LIMIT ?
        '''), (f'%{keyword}%', user_id, user_id, user_id, user_id, limit)).fetchall()

        users = [{
            'id': row[0],
            'username': row[1],
            'grade_level': row[2],
            'created_at': row[3].isoformat() if row[3] else None
        } for row in result]

        return jsonify({
            'success': True,
            'data': users
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/friends/add', methods=['POST'])
@jwt_required()
def add_friend():
    """"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        friend_id = data.get('friend_id')

        if not friend_id:
            return jsonify({
                'success': False,
                'error': 'friend_id is required'
            }), 400

        if friend_id == user_id:
            return jsonify({
                'success': False,
                'error': 'Cannot add yourself as a friend'
            }), 400

        conn = db.engine.connect()

        # 
        existing = conn.execute(db.text('''
            SELECT status FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        '''), (user_id, friend_id, friend_id, user_id)).fetchone()

        if existing:
            status = existing[0]
            if status == 'accepted':
                return jsonify({
                    'success': False,
                    'error': 'Already friends'
                }), 400
            elif status == 'pending':
                return jsonify({
                    'success': False,
                    'error': 'Friend request already pending'
                }), 400

        # 
        conn.execute(db.text('''
            INSERT INTO friendships (user_id, friend_id, status)
            VALUES (?, ?, 'pending')
        '''), (user_id, friend_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Friend request sent'
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/friends', methods=['GET'])
@jwt_required()
def get_friends():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        result = conn.execute(db.text('''
            SELECT CASE 
                WHEN f.user_id = ? THEN u2.id 
                ELSE u1.id 
            END as friend_id,
            CASE 
                WHEN f.user_id = ? THEN u2.username 
                ELSE u1.username 
            END as username,
            CASE 
                WHEN f.user_id = ? THEN u2.grade_level 
                ELSE u1.grade_level 
            END as grade_level,
            f.accepted_at, f.status
            FROM friendships f
            JOIN users u1 ON f.user_id = u1.id
            JOIN users u2 ON f.friend_id = u2.id
            WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
            ORDER BY f.accepted_at DESC
        '''), (user_id, user_id, user_id, user_id, user_id)).fetchall()

        friends = [{
            'id': row[0],
            'username': row[1],
            'grade_level': row[2],
            'accepted_at': row[3].isoformat() if row[3] else None,
            'status': row[4]
        } for row in result]

        return jsonify({
            'success': True,
            'data': friends
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/friends/pending', methods=['GET'])
@jwt_required()
def get_pending_requests():
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        result = conn.execute(db.text('''
            SELECT f.id, u.username, u.grade_level, f.request_at
            FROM friendships f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = 'pending'
            ORDER BY f.request_at DESC
        '''), (user_id,)).fetchall()

        requests = [{
            'request_id': row[0],
            'username': row[1],
            'grade_level': row[2],
            'requested_at': row[3].isoformat() if row[3] else None
        } for row in result]

        return jsonify({
            'success': True,
            'data': requests
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/friends/<int:request_id>/accept', methods=['POST'])
@jwt_required()
def accept_friend_request(request_id):
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        request_data = conn.execute(db.text('''
            SELECT user_id, friend_id FROM friendships 
            WHERE id = ? AND friend_id = ? AND status = 'pending'
        '''), (request_id, user_id)).fetchone()

        if not request_data:
            return jsonify({
                'success': False,
                'error': 'Friend request not found'
            }), 404

        requester_id, friend_id = request_data

        # 
        conn.execute(db.text('''
            UPDATE friendships SET
                status = 'accepted',
                accepted_at = CURRENT_TIMESTAMP
            WHERE id = ?
        '''), (request_id,))

        # 
        conn.execute(db.text('''
            INSERT INTO friendships (user_id, friend_id, status, accepted_at)
            VALUES (?, ?, 'accepted', CURRENT_TIMESTAMP)
        '''), (friend_id, requester_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Friend request accepted'
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/friends/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_friend_request(request_id):
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        request_data = conn.execute(db.text('''
            SELECT id FROM friendships 
            WHERE id = ? AND friend_id = ? AND status = 'pending'
        '''), (request_id, user_id)).fetchone()

        if not request_data:
            return jsonify({
                'success': False,
                'error': 'Friend request not found'
            }), 404

        # 
        conn.execute(db.text('''
            UPDATE friendships SET status = 'rejected'
            WHERE id = ?
        '''), (request_id,))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Friend request rejected'
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/friends/<int:friend_id>/remove', methods=['DELETE'])
@jwt_required()
def remove_friend(friend_id):
    """"""
    try:
        user_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        conn.execute(db.text('''
            DELETE FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        '''), (user_id, friend_id, friend_id, user_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Friend removed'
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ====================  API ====================

@app.route('/api/social/share', methods=['POST'])
@jwt_required()
def create_share():
    """"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        share_type = data.get('share_type')  # achievement, badge, milestone
        content = data.get('content')
        platform = data.get('platform')

        if not share_type or not content:
            return jsonify({
                'success': False,
                'error': 'share_type and content are required'
            }), 400

        conn = db.engine.connect()

        # 
        conn.execute(db.text('''
            INSERT INTO social_shares (user_id, share_type, content, platform)
            VALUES (?, ?, ?, ?)
        '''), (user_id, share_type, str(content), platform))

        conn.commit()

        # 
        conn.execute(db.text('''
            INSERT INTO user_points (user_id, total_points, daily_points, level, experience, streak)
            VALUES (?, 0, 0, 1, 0, 0)
            ON CONFLICT(user_id) DO UPDATE SET
                total_points = total_points + ?,
                daily_points = daily_points + ?,
                experience = experience + ?,
                updated_at = CURRENT_TIMESTAMP
        '''), (user_id, 3, 3, 3))

        # 
        conn.execute(db.text('''
            INSERT INTO point_history (user_id, points, reason)
            VALUES (?, 3, ?)
        '''), (user_id, f'Share {share_type}'))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Share recorded',
            'points_earned': 3
        })
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/social/shares', methods=['GET'])
@jwt_required()
def get_shares():
    """"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)

        conn = db.engine.connect()

        result = conn.execute(db.text('''
            SELECT id, share_type, content, platform, shared_at
            FROM social_shares
            WHERE user_id = ?
            ORDER BY shared_at DESC
            LIMIT ?
        '''), (user_id, limit)).fetchall()

        import json
        shares = [{
            'id': row[0],
            'share_type': row[1],
            'content': json.loads(row[2]),
            'platform': row[3],
            'shared_at': row[4].isoformat() if row[4] else None
        } for row in result]

        return jsonify({
            'success': True,
            'data': shares
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ====================  ====================
# P2

# ====================  API ====================

@app.route('/api/parent/register', methods=['POST'])
def parent_register():
    """"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        child_user_id = data.get('child_user_id')
        relationship = data.get('relationship', 'parent')

        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username and password are required'
            }), 400

        conn = db.engine.connect()

        # 
        conn.execute(db.text('''
            INSERT INTO parents (username, password_hash, email, relationship)
            VALUES (?, ?, ?, ?)
        '''), (username, password, email, relationship))

        # ID
        parent_id = conn.execute(db.text('''
            SELECT last_insert_rowid()
        ''')).fetchone()[0]

        # 
        if child_user_id:
            conn.execute(db.text('''
                INSERT INTO child_students (parent_id, child_user_id, relationship)
                VALUES (?, ?, ?)
            '''), (parent_id, child_user_id, relationship))

        conn.commit()

        # 
        access_token = create_access_token(identity=parent_id)

        return jsonify({
            'success': True,
            'message': 'Parent registered successfully',
            'data': {
                'token': access_token,
                'parent': {
                    'id': parent_id,
                    'username': username,
                    'email': email,
                    'relationship': relationship
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/login', methods=['POST'])
def parent_login():
    """"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        conn = db.engine.connect()

        # 
        parent = conn.execute(db.text('''
            SELECT id, username, email, relationship FROM parents
            WHERE username = ? AND password_hash = ?
        '''), (username, password)).fetchone()

        if not parent:
            return jsonify({
                'success': False,
                'error': 'Invalid username or password'
            }), 401

        # 
        conn.execute(db.text('''
            UPDATE parents SET last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        '''), (parent[0],))
        conn.commit()

        # 
        access_token = create_access_token(identity=parent[0])

        return jsonify({
            'success': True,
            'message': 'Parent login successful',
            'data': {
                'token': access_token,
                'parent': {
                    'id': parent[0],
                    'username': parent[1],
                    'email': parent[2],
                    'relationship': parent[3]
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/settings', methods=['GET'])
@jwt_required()
def get_parent_settings():
    """"""
    try:
        parent_id = get_jwt_identity()
        conn = db.engine.connect()

        settings = conn.execute(db.text('''
            SELECT daily_time_limit, weekly_word_goal,
                   enable_notifications, notification_time,
                   monitor_progress, monitor_accuracy
            FROM parent_settings WHERE parent_id = ?
        '''), (parent_id,)).fetchone()

        if not settings:
            # 
            conn.execute(db.text('''
                INSERT INTO parent_settings (parent_id)
                VALUES (?)
            '''), (parent_id,))
            conn.commit()
            
            return jsonify({
                'success': True,
                'data': {
                    'daily_time_limit': 60,
                    'weekly_word_goal': 50,
                    'enable_notifications': True,
                    'notification_time': '19:00',
                    'monitor_progress': True,
                    'monitor_accuracy': True
                }
            })

        return jsonify({
            'success': True,
            'data': {
                'daily_time_limit': settings[0],
                'weekly_word_goal': settings[1],
                'enable_notifications': settings[2],
                'notification_time': settings[3],
                'monitor_progress': settings[4],
                'monitor_accuracy': settings[5]
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/settings', methods=['PUT'])
@jwt_required()
def update_parent_settings():
    """"""
    try:
        parent_id = get_jwt_identity()
        data = request.get_json()

        conn = db.engine.connect()

        # SQL
        update_fields = []
        params = []
        
        if 'daily_time_limit' in data:
            update_fields.append('daily_time_limit = ?')
            params.append(data['daily_time_limit'])
        
        if 'weekly_word_goal' in data:
            update_fields.append('weekly_word_goal = ?')
            params.append(data['weekly_word_goal'])
        
        if 'enable_notifications' in data:
            update_fields.append('enable_notifications = ?')
            params.append(data['enable_notifications'])
        
        if 'notification_time' in data:
            update_fields.append('notification_time = ?')
            params.append(data['notification_time'])
        
        if 'monitor_progress' in data:
            update_fields.append('monitor_progress = ?')
            params.append(data['monitor_progress'])
        
        if 'monitor_accuracy' in data:
            update_fields.append('monitor_accuracy = ?')
            params.append(data['monitor_accuracy'])

        if not update_fields:
            return jsonify({
                'success': False,
                'error': 'No settings to update'
            }), 400

        params.append(parent_id)
        
        conn.execute(db.text(f'''
            INSERT INTO parent_settings (parent_id)
            VALUES ({', '.join(['?'] * 6)})
            ON CONFLICT(parent_id) DO UPDATE SET
                {', '.join(update_fields)}
        '''), params)

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Settings updated successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/children', methods=['GET'])
@jwt_required()
def get_parent_children():
    """"""
    try:
        parent_id = get_jwt_identity()
        conn = db.engine.connect()

        children = conn.execute(db.text('''
            SELECT cs.child_user_id, u.username, u.grade_level, cs.relationship,
                   cs.can_monitor, cs.can_set_time_limit, cs.can_receive_reports
            FROM child_students cs
            JOIN users u ON cs.child_user_id = u.id
            WHERE cs.parent_id = ?
        '''), (parent_id,)).fetchall()

        children_list = [{
            'id': child[0],
            'username': child[1],
            'grade_level': child[2],
            'relationship': child[3],
            'can_monitor': child[4],
            'can_set_time_limit': child[5],
            'can_receive_reports': child[6]
        } for child in children]

        return jsonify({
            'success': True,
            'data': children_list
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/monitor/<int:child_user_id>', methods=['GET'])
@jwt_required()
def get_child_monitor(child_user_id):
    """"""
    try:
        import datetime
        parent_id = get_jwt_identity()
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())

        conn = db.engine.connect()

        # 
        permission = conn.execute(db.text('''
            SELECT can_monitor FROM child_students
            WHERE parent_id = ? AND child_user_id = ?
        '''), (parent_id, child_user_id)).fetchone()

        if not permission or not permission[0]:
            return jsonify({
                'success': False,
                'error': 'Permission denied'
            }), 403

        # 
        today_learning = conn.execute(db.text('''
            SELECT total_time, words_learned, correct_rate
            FROM learning_checkin
            WHERE user_id = ? AND checkin_date = ?
        '''), (child_user_id, today.isoformat())).fetchone()

        # 
        week_learning = conn.execute(db.text('''
            SELECT SUM(total_time) as total_time,
                   SUM(words_learned) as total_words,
                   AVG(correct_rate) as avg_accuracy,
                   COUNT(*) as days_studied
            FROM learning_checkin
            WHERE user_id = ? AND checkin_date >= ?
        '''), (child_user_id, week_start.isoformat())).fetchone()

        # 
        mastered_words = conn.execute(db.text('''
            SELECT COUNT(DISTINCT word_id) FROM learning_records
            WHERE user_id = ? AND is_correct = 1
        '''), (child_user_id,)).fetchone()

        # 
        wrong_count = conn.execute(db.text('''
            SELECT COUNT(*) FROM wrong_answers
            WHERE user_id = ? AND mastered = 0
        '''), (child_user_id,)).fetchone()

        return jsonify({
            'success': True,
            'data': {
                'child_user_id': child_user_id,
                'today': {
                    'total_time': today_learning[0] if today_learning else 0,
                    'words_learned': today_learning[1] if today_learning else 0,
                    'correct_rate': today_learning[2] if today_learning else None
                },
                'week': {
                    'total_time': week_learning[0] if week_learning and week_learning[0] else 0,
                    'total_words': week_learning[1] if week_learning and week_learning[1] else 0,
                    'avg_accuracy': float(week_learning[2]) if week_learning and week_learning[2] else None,
                    'days_studied': week_learning[3] if week_learning and week_learning[3] else 0
                },
                'overall': {
                    'mastered_words': mastered_words[0] if mastered_words else 0,
                    'wrong_count': wrong_count[0] if wrong_count else 0
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/reports', methods=['GET'])
@jwt_required()
def get_parent_reports():
    """"""
    try:
        import datetime
        parent_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)

        conn = db.engine.connect()

        # 
        reports = conn.execute(db.text('''
            SELECT pr.id, u.username as child_name, pr.report_type,
                   pr.report_data, pr.report_date, pr.is_read
            FROM parent_reports pr
            JOIN users u ON pr.child_user_id = u.id
            WHERE pr.parent_id = ?
            ORDER BY pr.created_at DESC
            LIMIT ?
        '''), (parent_id, limit)).fetchall()

        reports_list = [{
            'id': report[0],
            'child_name': report[1],
            'report_type': report[2],
            'report_data': report[3],
            'report_date': report[4],
            'is_read': report[5]
        } for report in reports]

        return jsonify({
            'success': True,
            'data': reports_list
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/reports/<int:report_id>/read', methods=['POST'])
@jwt_required()
def mark_report_read(report_id):
    """"""
    try:
        parent_id = get_jwt_identity()
        conn = db.engine.connect()

        conn.execute(db.text('''
            UPDATE parent_reports SET is_read = 1
            WHERE id = ? AND parent_id = ?
        '''), (report_id, parent_id))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Report marked as read'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/parent/comparison/<int:child_user_id>', methods=['GET'])
@jwt_required()
def get_progress_comparison(child_user_id):
    """"""
    try:
        parent_id = get_jwt_identity()
        conn = db.engine.connect()

        # 
        child_mastered = conn.execute(db.text('''
            SELECT COUNT(DISTINCT word_id) FROM learning_records
            WHERE user_id = ? AND is_correct = 1
        '''), (child_user_id,)).fetchone()

        child_mastered_count = child_mastered[0] if child_mastered else 0

        # 
        peer_stats = conn.execute(db.text('''
            SELECT AVG(mastered_count) as avg_mastered,
                   MAX(mastered_count) as max_mastered,
                   MIN(mastered_count) as min_mastered
            FROM (
                SELECT lr.user_id, COUNT(DISTINCT lr.word_id) as mastered_count
                FROM learning_records lr
                JOIN users u ON lr.user_id = u.id
                WHERE lr.is_correct = 1 AND u.grade_level = (
                    SELECT grade_level FROM users WHERE id = ?
                )
                GROUP BY lr.user_id
            ) peer_stats
        '''), (child_user_id,)).fetchone()

        if peer_stats and peer_stats[0]:
            avg_mastered, max_mastered, min_mastered = peer_stats

            # 
            if max_mastered > min_mastered:
                top_percentile = ((max_mastered - child_mastered_count) / (max_mastered - min_mastered)) * 100
                bottom_percentile = ((child_mastered_count - min_mastered) / (max_mastered - min_mastered)) * 100
            else:
                top_percentile = 50
                bottom_percentile = 50

            return jsonify({
                'success': True,
                'data': {
                    'child_user_id': child_user_id,
                    'child_mastered': child_mastered_count,
                    'peer_average': avg_mastered,
                    'peer_max': max_mastered,
                    'peer_min': min_mastered,
                    'top_percentile': top_percentile,
                    'bottom_percentile': bottom_percentile,
                    'message': f'{child_mastered_count}' +
                            f'{int(avg_mastered)}'
                }
            })
        else:
            return jsonify({
                'success': True,
                'data': {
                    'child_user_id': child_user_id,
                    'child_mastered': child_mastered_count,
                    'message': ''
                }
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
