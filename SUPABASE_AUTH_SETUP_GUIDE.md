# Supabase Auth 接入方案 - 完整指南

## ✅ 已完成的内容

### 📁 创建的文件

```
├── SUPABASE_AUTH_PLAN.md          # 方案总览
├── .env.example                   # 环境变量模板
├── database/
│   └── migrations/
│       └── 001_auth_setup.sql     # 数据库初始化脚本
├── src/
│   ├── lib/
│   │   └── supabase.ts            # Supabase Client
│   ├── hooks/
│   │   └── useAuth.ts             # Auth Hook
│   ├── components/
│   │   ├── AuthGuard.tsx          # 路由守卫
│   │   └── index.ts               # 组件导出
│   ├── pages/
│   │   ├── Login.tsx              # 登录页面
│   │   ├── Register.tsx           # 注册页面
│   │   └── index.ts               # 页面导出
│   └── types/
│       └── supabase.ts            # 类型定义
└── src/App.tsx                    # 更新：添加路由守卫
```

### 📦 安装的依赖

```bash
pnpm add @supabase/supabase-js
```

---

## 🚀 快速接入步骤

### 1️⃣ 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目名称（如：pooop-auth）
4. 设置数据库密码（请牢记）
5. 选择 Region（推荐离你最近的）
6. 等待项目创建完成（约1-2分钟）

### 2️⃣ 获取环境变量

进入项目后，在左侧菜单找到 **Project Settings** → **API**：

```bash
# 复制这两个值
Project URL: https://xxxxxxxxxxxx.supabase.co  → VITE_SUPABASE_URL
anon key:    eyJhbG...                          → VITE_SUPABASE_ANON_KEY
```

### 3️⃣ 配置环境变量

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑 .env 文件，填入你的值
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4️⃣ 初始化数据库

1. 在 Supabase Dashboard 中点击 **SQL Editor**
2. 点击 **New query**
3. 复制 `database/migrations/001_auth_setup.sql` 的全部内容
4. 粘贴到编辑器中
5. 点击 **Run** 执行

✅ 成功后你会看到：`Supabase Auth 数据库初始化完成！`

### 5️⃣ 启动项目

```bash
# 安装依赖（如果还没安装）
pnpm install

# 启动开发服务器
pnpm dev
```

---

## 🎯 功能特性

### 🔐 认证功能

- ✅ 邮箱 + 密码注册
- ✅ 邮箱 + 密码登录
- ✅ 会话持久化（自动登录）
- ✅ 路由守卫（未登录跳转到登录页）

### 👥 情侣绑定

- ✅ 自动生成邀请码（8位字母数字）
- ✅ 输入邀请码绑定伴侣
- ✅ 双方必须登录后才能绑定

### 🛡️ 安全特性

- ✅ RLS (行级安全) - 用户只能访问自己的数据
- ✅ 可以访问伴侣的数据
- ✅ 未登录用户无法访问任何数据

---

## 📖 使用流程

### 1. 首次使用

```
打开应用 → 显示登录页 → 点击"立即注册"
→ 填写昵称、邮箱、密码 → 注册成功 → 进入首页
```

### 2. 绑定伴侣

**方式一：生成邀请码**
```
登录后 → 点击"绑定伴侣" → 显示我的邀请码
→ 复制给伴侣 → 伴侣输入邀请码 → 绑定成功
```

**方式二：输入邀请码**
```
登录后 → 点击"绑定伴侣" → 输入伴侣的邀请码
→ 确认绑定 → 绑定成功
```

### 3. 日常使用

```
自动登录 → 查看双方记录 → 发送爱心
→ 添加记录 → 查看历史
```

---

## 🔧 常见问题

### Q1: 如何查看邀请码？
在绑定伴侣页面，你的邀请码会自动显示。

### Q2: 可以更换伴侣吗？
目前不支持。需要手动修改数据库或重新注册。

### Q3: 忘记密码怎么办？
目前版本不支持重置密码。后续可以添加该功能。

### Q4: 数据安全吗？
是的。所有数据都通过 RLS 保护，只有你和伴侣能看到。

---

## 📝 后续可扩展功能

1. **邮箱验证** - 注册时发送验证邮件
2. **密码重置** - 通过邮箱重置密码
3. **OAuth 登录** - 微信、QQ、Google 登录
4. **匿名登录** - 先体验，后注册
5. **实时同步** - 使用 Supabase Realtime 实时更新
6. **推送通知** - 使用 Supabase Edge Functions 发送提醒

---

## 🎉 完成！

现在你已经有了完整的 Supabase Auth 接入方案！
按照上面的步骤操作，几分钟内就能完成接入。

如有问题，请检查：
1. 环境变量是否正确填写
2. SQL 脚本是否成功执行
3. 浏览器控制台是否有错误信息

祝使用愉快！💩💕
