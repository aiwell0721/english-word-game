#!/bin/bash
# 测试游戏化系统API

BASE_URL="http://localhost:5000"

echo "🧪 测试游戏化系统API"
echo "================================"

# 先注册并登录获取token
echo "\n1. 用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gamer",
    "password": "test123",
    "email": "gamer@test.com",
    "grade_level": 3
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool

TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])")
echo "\n✅ 获取到Token: ${TOKEN:0:30}..."

# 测试获取积分
echo "\n2. 获取用户积分..."
curl -s -X GET "$BASE_URL/api/gamification/points" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 测试添加积分
echo "\n3. 添加积分..."
curl -s -X POST "$BASE_URL/api/gamification/points/add" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points": 50, "reason": "测试奖励"}' | python3 -m json.tool

# 再次获取积分
echo "\n4. 再次获取积分..."
curl -s -X GET "$BASE_URL/api/gamification/points" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 测试获取成就列表
echo "\n5. 获取成就列表..."
curl -s -X GET "$BASE_URL/api/gamification/achievements" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 测试获取我的成就
echo "\n6. 获取我的成就..."
curl -s -X GET "$BASE_URL/api/gamification/achievements/my" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 解锁成就
echo "\n7. 解锁成就..."
curl -s -X POST "$BASE_URL/api/gamification/achievements/unlock" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"achievement_id": 1}' | python3 -m json.tool

# 测试排行榜
echo "\n8. 获取排行榜..."
curl -s -X GET "$BASE_URL/api/gamification/leaderboard?limit=5" | python3 -m.m json.tool

# 测试每日任务
echo "\n9. 获取每日任务..."
curl -s -X GET "$BASE_URL/api/gamification/daily-tasks" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# 更新任务进度
echo "\n10. 更新任务进度..."
curl -s -X POST "$BASE_URL/api/gamification/daily-tasks/1/progress" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progress": 1}' | python3 -m json.tool

echo "\n✅ 所有测试完成！"
