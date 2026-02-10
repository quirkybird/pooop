# Vercel 部署指南

## 🚀 快速部署

### 1. 准备环境变量

创建 `.env.production` 文件：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

或者在 Vercel 控制台设置环境变量。

### 2. 部署到 Vercel

#### 方式一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

#### 方式二：通过 Git 集成

1. 推送代码到 GitHub/GitLab/Bitbucket
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 导入项目
3. 配置环境变量
4. 自动部署

### 3. 配置说明

项目已配置 `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

这确保 React Router 的客户端路由能正常工作。

## ⚙️ 环境变量设置

在 Vercel 项目设置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Anon Key |

## 📁 构建输出

- 构建目录：`dist/`
- 入口文件：`dist/index.html`

## 🔧 自定义域名（可选）

在 Vercel Dashboard → Settings → Domains 中配置。

## ✅ 部署前检查清单

- [ ] Supabase 数据库已初始化
- [ ] 环境变量已配置
- [ ] `vercel.json` 已提交
- [ ] 构建测试通过 (`pnpm build`)

## 🐛 常见问题

### 404 页面刷新后报错
确保 `vercel.json` 中的 rewrites 配置正确，所有路由指向 `index.html`。

### 环境变量未生效
Vite 的环境变量必须以 `VITE_` 开头，并在客户端通过 `import.meta.env.VITE_XXX` 访问。

### API 请求失败
检查 Supabase RLS 策略是否正确配置，允许匿名访问或已登录用户访问。
