# English Word Game 综合测试计划

## 测试环境
- **前端**: http://localhost:5176
- **后端 API**: http://localhost:5001
- **数据库**: SQLite (database/word_game.db)

## 测试范围

### 1. 用户系统测试 ✅ (已修复)
- [ ] 学生注册流程
- [ ] 学生登录流程
- [ ] 家长注册流程
- [ ] 家长登录流程
- [ ] 视图切换（学生/家长）

### 2. 词汇学习测试
- [ ] 拼写练习模式
- [ ] 选择题模式
- [ ] 听音辨词模式
- [ ] 图片匹配模式
- [ ] 年级选择 (1-6 年级)

### 3. 游戏化系统测试
- [ ] 积分获取
- [ ] 成就解锁
- [ ] 排行榜显示
- [ ] 每日任务

### 4. 家长管理测试
- [ ] 学习监控
- [ ] 学习报告
- [ ] 时间管理设置

### 5. API 端点测试
- [ ] `POST /api/users/register` - 用户注册
- [ ] `POST /api/users/login` - 用户登录
- [ ] `GET /api/words` - 获取词汇
- [ ] `GET /api/health` - 健康检查

## 已知问题修复

### 前端语法错误 (已修复)
1. ✅ ParentLogin.tsx - FormEvent 类型 + 默认导出
2. ✅ ParentDashboard.tsx - JSX 闭合标签
3. ✅ ChoiceGame.tsx - 类型声明语法
4. ✅ ImageMatchingGame.tsx - for 循环语法
5. ✅ SyncManager.tsx - 闭合标签
6. ✅ WrongAnswersBook.tsx - className 属性

### 后端问题 (已修复)
1. ✅ Windows 编码问题（移除 emoji）
2. ✅ 数据库损坏（重新创建）
3. ✅ API 端口从 5000 改为 5001

### UserProvider 修复 (已修复)
1. ✅ 注册成功后自动登录逻辑
2. ✅ API 地址更新为 localhost:5001
3. ✅ 登录状态设置

## 测试步骤

### 手动测试流程
1. 访问 http://localhost:5176
2. 点击"立即注册"
3. 填写用户名、密码、选择年级
4. 点击"注册"按钮
5. 验证是否自动登录并跳转到 Dashboard
6. 验证 Dashboard 显示用户信息

### API 测试
```bash
# 健康检查
curl http://localhost:5001/api/health

# 注册新用户
curl -X POST http://localhost:5001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","grade_level":3}'

# 登录
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# 获取词汇
curl http://localhost:5001/api/words?level=1&limit=10
```

## 验收标准

### 注册流程 ✅
- [ ] 注册表单正常显示
- [ ] 提交后调用正确的 API (localhost:5001)
- [ ] 注册成功后自动登录
- [ ] 登录成功后设置 user 状态
- [ ] 页面跳转到 Dashboard

### 登录流程
- [ ] 登录表单正常显示
- [ ] 提交后调用 API
- [ ] 成功后保存 token 到 localStorage
- [ ] 显示 Dashboard 页面

### 词汇学习
- [ ] 可以选择年级
- [ ] 4 种学习模式可用
- [ ] 单词数据正确加载

## 测试报告模板

```markdown
## 测试结果

### 通过的功能
1. ...
2. ...

### 失败的功能
1. ...
   - 错误信息：...
   - 复现步骤：...

### Bug 列表
| ID | 问题描述 | 严重程度 | 状态 |
|----|---------|---------|------|
| 1  | ...     | 高/中/低 | 待修复 |
```

## 下一步行动

1. ✅ 修复所有前端语法错误
2. ✅ 修复 UserProvider 注册逻辑
3. ✅ 重启前后端服务
4. [ ] 执行手动测试
5. [ ] 执行 API 测试
6. [ ] 记录测试结果
7. [ ] 修复发现的问题
