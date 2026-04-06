# ==================== 家长管理系统 API ====================

@app.route('/api/parent/register', methods=['POST'])
def parent_register():
    """家长注册"""
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

        # 创建家长账户
        conn.execute(db.text('''
            INSERT INTO parents (username, password_hash, email, relationship)
            VALUES (?, ?, ?, ?)
        '''), (username, password, email, relationship))

        # 获取家长ID
        parent_id = conn.execute(db.text('''
            SELECT last_insert_rowid()
        ''')).fetchone()[0]

        # 如果关联子学生，创建关联
        if child_user_id:
            conn.execute(db.text('''
                INSERT INTO child_students (parent_id, child_user_id, relationship)
                VALUES (?, ?, ?)
            '''), (parent_id, child_user_id, relationship))

        conn.commit()

        # 生成访问令牌
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
    """家长登录"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        conn = db.engine.connect()

        # 查找家长
        parent = conn.execute(db.text('''
            SELECT id, username, email, relationship FROM parents
            WHERE username = ? AND password_hash = ?
        '''), (username, password)).fetchone()

        if not parent:
            return jsonify({
                'success': False,
                'error': 'Invalid username or password'
            }), 401

        # 更新最后登录时间
        conn.execute(db.text('''
            UPDATE parents SET last_login = CURRENT_TIMESTAMP
            WHERE id = ?
        '''), (parent[0],))
        conn.commit()

        # 生成访问令牌
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
    """获取家长设置"""
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
            # 创建默认设置
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
    """更新家长设置"""
    try:
        parent_id = get_jwt_identity()
        data = request.get_json()

        conn = db.engine.connect()

        # 构建更新SQL
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
    """获取家长关联的子学生"""
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
    """获取子学生学习监控数据"""
    try:
        import datetime
        parent_id = get_jwt_identity()
        today = datetime.date.today()
        week_start = today - datetime.timedelta(days=today.weekday())

        conn = db.engine.connect()

        # 检查是否有权限监控
        permission = conn.execute(db.text('''
            SELECT can_monitor FROM child_students
            WHERE parent_id = ? AND child_user_id = ?
        '''), (parent_id, child_user_id)).fetchone()

        if not permission or not permission[0]:
            return jsonify({
                'success': False,
                'error': 'Permission denied'
            }), 403

        # 获取今日学习数据
        today_learning = conn.execute(db.text('''
            SELECT total_time, words_learned, correct_rate
            FROM learning_checkin
            WHERE user_id = ? AND checkin_date = ?
        '''), (child_user_id, today.isoformat())).fetchone()

        # 获取本周学习数据
        week_learning = conn.execute(db.text('''
            SELECT SUM(total_time) as total_time,
                   SUM(words_learned) as total_words,
                   AVG(correct_rate) as avg_accuracy,
                   COUNT(*) as days_studied
            FROM learning_checkin
            WHERE user_id = ? AND checkin_date >= ?
        '''), (child_user_id, week_start.isoformat())).fetchone()

        # 获取掌握单词数
        mastered_words = conn.execute(db.text('''
            SELECT COUNT(DISTINCT word_id) FROM learning_records
            WHERE user_id = ? AND is_correct = 1
        '''), (child_user_id,)).fetchone()

        # 获取错题数
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
    """获取家长学习报告"""
    try:
        import datetime
        parent_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)

        conn = db.engine.connect()

        # 获取报告
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
    """标记报告已读"""
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
    """获取子学生进度对比（与同龄人对比）"""
    try:
        parent_id = get_jwt_identity()
        conn = db.engine.connect()

        # 获取子学生掌握单词数
        child_mastered = conn.execute(db.text('''
            SELECT COUNT(DISTINCT word_id) FROM learning_records
            WHERE user_id = ? AND is_correct = 1
        '''), (child_user_id,)).fetchone()

        child_mastered_count = child_mastered[0] if child_mastered else 0

        # 获取同年级学生的平均数据
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
            ) peer_stats最
        '''), (child_user_id,)).fetchone()

        if peer_stats and peer_stats[0]:
            avg_mastered, max_mastered, min_mastered = peer_stats

            # 计算百分位
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
                    'message': f'你的孩子掌握了{child_mastered_count}个单词，' +
                            f'同年级平均掌握{int(avg_mastered)}个单词'
                }
            })
        else:
            return jsonify({
                'success': True,
                'data': {
                    'child_user_id': child_user_id,
                    'child_mastered': child_mastered_count,
                    'message': '暂无对比数据'
                }
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
