# 💩 便便实况播报

一个温馨可爱的情侣互动应用，记录和分享日常生活中的点滴，让关心变得更加有趣。

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
</p>

---

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/yourusername/pooop.git
cd pooop

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 📅 开发时间线

<details open>
<summary><h3 style="display: inline;">📌 2026-02-10 - 项目启动</h3></summary>

#### 🎉 项目初始化
- 搭建 React + TypeScript + Vite 基础架构
- 配置 Tailwind CSS 样式系统
- 集成 Supabase 后端服务
- 创建基础项目结构和路由

</details>

---

<details open>
<summary><h3 style="display: inline;">📌 2026-02-11 - 核心功能开发日</h3></summary>

#### 🎨 UI/UX 增强
- **上午** - 添加 Dicebear 头像生成库
- 引入丰富的图标库（Lucide React）
- 设计温馨的配色方案（粉色主题）

#### 🔐 认证系统完善
- **上午** - 实现完整的用户认证流程
- 用户注册/登录功能
- 会话管理和 token 自动刷新
- 错误处理和用户提示
- 头像 emoji 支持

#### 🖼️ 头像系统
- **下午** - 开发头像选择功能
- 集成 Dicebear 头像生成
- 头像编辑弹窗组件
- 随机种子刷新功能
- 实时预览效果

#### 💬 通知系统
- **下午** - 集成 Sonner Toast 通知
- 操作成功/失败的提示
- 友好的用户反馈机制

#### 📊 数据展示
- **下午** - 开发 Timeline 时间线组件
- 历史记录展示
- 日期范围筛选功能
- 时区处理（PostgreSQL）

#### ❤️ 互动功能
- **下午** - 实现爱心点赞系统
- 点赞/取消点赞功能
- 软删除机制（保留历史）
- 乐观更新（Optimistic Update）
- 浮动爱心动画效果

#### ⚡ 性能优化
- **晚上** - 代码重构和优化
- 移除未使用的导入
- 提升页面加载性能

</details>

---

## ✨ 功能特性

### 💑 情侣绑定
- 邀请码绑定机制
- 实时同步双方记录
- 甜蜜绑定状态展示

### 📝 记录系统
- 便便形状记录（Bristol 分型）
- 心情状态标记
- 备注和标签功能
- 时间线展示

### ❤️ 爱心互动
- 为伴侣记录点赞
- 实时收到点赞通知
- 温暖的宽慰话语
- 今日爱心统计卡片

### 🔔 智能提醒
- 定时提醒功能
- 温柔提示卡片
- 可自定义提醒时间

### 👤 个性化
- Dicebear 头像生成
- 多种头像风格可选
- 实时预览和切换

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 8 |
| **样式方案** | Tailwind CSS 4 |
| **状态管理** | Zustand |
| **后端服务** | Supabase |
| **认证** | Supabase Auth |
| **数据库** | PostgreSQL |
| **UI 组件** | shadcn/ui |
| **通知** | Sonner |
| **图标** | Lucide React |
| **头像生成** | Dicebear |

---

## 📁 项目结构

```
pooop/
├── database/           # 数据库迁移文件
│   └── migrations/
├── src/
│   ├── components/     # 可复用组件
│   │   ├── ui/        # UI 基础组件
│   │   └── ...
│   ├── pages/          # 页面组件
│   ├── services/       # API 服务层
│   ├── stores/         # 状态管理
│   ├── types/          # TypeScript 类型
│   └── lib/           # 工具库
├── public/            # 静态资源
└── docs/              # 项目文档
```

---

## 🎯 核心功能详解

### 乐观更新（Optimistic Update）

为了提供流畅的用户体验，我们实现了乐观更新机制：

1. **立即更新 UI** - 用户点击后马上改变界面状态
2. **后台同步** - 异步发送请求到服务器
3. **失败回滚** - 如果请求失败，自动恢复到之前状态

```typescript
// 示例：爱心点赞的乐观更新
const handleHeartClick = async (recordId: string) => {
  // 1. 乐观更新：立即改变前端状态
  setHasHearted(true);
  
  try {
    // 2. 发送请求
    await api.reaction.create({ recordId });
  } catch (error) {
    // 3. 失败回滚
    setHasHearted(false);
  }
};
```

### 软删除机制

为了避免数据丢失，采用软删除策略：

```sql
-- 添加 is_liked 字段代替物理删除
ALTER TABLE heart_reactions ADD COLUMN is_liked BOOLEAN DEFAULT TRUE;

-- 创建部分唯一索引
CREATE UNIQUE INDEX idx_heart_reactions_unique 
ON heart_reactions(from_user_id, record_id) 
WHERE is_liked = TRUE;
```

---

## 🚀 部署

项目已配置 Vercel 部署，详细指南请参考：[Vercel 部署指南](./docs/VERCEL_DEPLOYMENT.md)

```bash
# 生产构建
npm run build

# 预览生产构建
npm run preview
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License © 2026

---

<p align="center">
  Made with ❤️ for couples
</p>
