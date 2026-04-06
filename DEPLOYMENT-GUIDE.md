# 本地部署和测试指南

**项目**: 小学生英语单词学习游戏
**部署方式**: 本地开发服务器

---

## 📋 前置要求

### 1. 检查Node.js环境

```bash
# 检查Node.js版本
node --version
# 需要 Node.js >= 18.0.0

# 检查npm版本
npm --version
# 需要 npm >= 9.0.0
```

### 2. 检查Python环境（后端）

```bash
# 检查Python版本
python --version
# 需要 Python >= 3.8

# 检查pip版本
pip --version
```

---

## 🚀 部署步骤

### 步骤1：克隆或进入项目目录

```bash
# 如果项目在本地，直接进入
cd /workspace/projects/workspace/english-word-game

# 如果需要克隆，使用：
git clone [repository-url]
cd english-word-game
```

### 步骤2：安装前端依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 如果遇到问题，可以尝试清理缓存
rm -rf node_modules package-lock.json
npm install
```

### 步骤3：启动后端服务

打开新的终端窗口：

```bash
# 进入后端目录
cd /workspace/projects/workspace/english-word-game/backend

# 安装依赖（首次运行）
pip install flask flask-cors flask-sqlalchemy flask-jwt-extended

# 启动后端服务器
python app.py
```

后端服务器将在 `http://localhost:5001` 启动

### 步骤4：启动前端开发服务器

回到原来的终端窗口：

```bash
# 确保在前端目录
cd /workspace/projects/workspace/english-word-game/frontend

# 启动开发服务器
npm run dev
```

前端服务器将在 `http://localhost:5173` 启动

---

## 🧪 测试步骤

### 1. 打开浏览器访问

在浏览器中打开：

```
http://localhost:5173
```

### 2. 测试用户注册和登录

1. 点击"注册"
2. 输入用户名、密码、邮箱
3. 选择年级（1-6年级）
4. 点击"注册"

5. 登录账号
6. 验证登录成功

### 3. 测试P2 Bug修复

#### BUG-003：排行榜实时更新
1. 进入"游戏化" → "排行榜"
2. 观察排行榜是否每30秒自动刷新
3. 完成一个学习任务，获得积分
4. 观察排行榜是否自动更新

#### BUG-004：成就弹窗重叠
1. 快速完成多个每日任务
2. 观察成就弹窗是否按顺序显示
3. 验证弹窗间隔约0.5秒，无重叠

#### BUG-005：高分屏图片适配
1. 在高分屏设备（iPhone 14 Pro等）上测试
2. 进入词汇学习游戏
3. 观察图片是否清晰，无模糊

#### BUG-006：每日任务重置
1. 查看今日任务状态
2. 记录当前时间
3. 关闭应用后重新打开
4. 验证任务状态正确

#### BUG-007：好友搜索模糊匹配
1. 进入"游戏化" → "好友" → "搜索好友"
2. 输入部分昵称（如"test"）
3. 验证是否能模糊搜索到结果

#### BUG-008：主题切换无白屏
1. 进入"游戏化" → "主题皮肤"
2. 激活不同的主题
3. 观察是否平滑切换，无白屏闪烁

### 4. 测试核心功能

- 用户管理（注册/登录/登出）
- 词汇学习（拼写/选择题/听音/图片匹配）
- 游戏化系统（积分/成就/排行榜/每日任务）
- 学习管理（错题本/智能复习/学习周报）
- 家长管理（认证/监控/报告/进度对比）

### 5. 测试P1/P2增强功能

- P1：
  - 复习提醒
  - 主题皮肤系统
  - 多设备同步

- P2：
  - 排行榜功能
  - 好友系统
  - 社交分享功能

---

## 🐛 常见问题

### 问题1：端口被占用

**错误信息**：`Error: listen EADDRINUSE: address already in use ::5001`

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :5001
lsof -i :5173

# 杀掉进程
kill -9 [PID]

# 或者修改端口配置
# 编辑 frontend/vite.config.ts
# 编辑 backend/app.py
```

### 问题2：依赖安装失败

**解决方案**：
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm cache clean --force

# 使用国内镜像
npm config set registry https://registry.np.taobao.org

# 重新安装
npm install
```

### 问题3：后端数据库错误

**错误信息**：`sqlite3.OperationalError: no such table`

**解决方案**：
```bash
# 删除现有数据库，重新初始化
rm -rf /workspace/projects/workspace/english-word-game/database/word_game.db

# 重启后端服务器
python app.py
```

### 问题4：API请求失败

**错误信息**：`Network Error` 或 `CORS Error`

**解决方案**：
1. 确保后端服务器正在运行
2. 检查前端配置的API地址
3. 打开浏览器开发者工具查看网络请求

---

## 📊 测试清单

### 必测项目

| 功能模块 | 测试项 | 状态 |
|---------|-------|------|
| 用户管理 | 注册、登录、登出 | ⏳ 待测试 |
| 词汇学习 | 拼写、选择题、听音、图片匹配 | ⏳ 待测试 |
| 游戏化 | 积分、成就、排行榜、每日任务 | ⏳ 待测试 |
| 学习管理 | 错题本、智能复习、学习周报 | ⏳ 待测试 |
| 家长管理 | 认证、监控、报告、进度对比 | ⏳ 待测试 |

### P2 Bug修复验证

| Bug ID | 测试项 | 状态 |
|--------|-------|------|
| BUG-003 | 排行榜实时更新（30秒轮询） | ⏳ 待测试 |
| BUG-004 | 成就弹窗队列（0.5秒间隔） | ⏳ 待测试 |
| BUG-005 | 高分屏图片适配（DPR 2/3） | ⏳ 待测试 |
| BUG-006 | 每日任务重置（日期检查） | ⏳ 待测试 |
| BUG-007 | 好友搜索模糊匹配 | ⏳ 待测试 |
| BUG-008 | 主题切换平滑无白屏 | ⏳ 待测试 |

---

## ✨ 测试完成标准

### 成功标准

1. ✅ 所有核心功能正常工作
2. ✅ 所有P2 Bug修复验证通过
3. ✅ 无控制台错误
4. ✅ 无明显的UI/UX问题
5. ✅ 性能流畅，无明显卡顿

### 需要修复

如果测试发现任何问题：

1. 记录错误信息
2. 记录复现步骤
3. 记录浏览器控制台输出
4. 反馈给开发团队

---

##🎯 测试完成后的操作

测试完成后，请反馈以下信息：

1. 测试通过/失败的项目
2. 发现的Bug和问题
3. 整体性能感受
4. 改进建议

根据测试反馈，我们可以：

- 修复发现的Bug
- 优化性能
- 改进用户体验
- 准备正式MVP发布

---

**测试指南创建时间**: 2026-04-05 02:30
**下一步**: 开始部署和测试
