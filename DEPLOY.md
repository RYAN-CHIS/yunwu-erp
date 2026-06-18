# 允物品牌经营系统 V3.2 — 部署指南

## 一、前置准备

### 1. 注册 Neon 账号（免费 PostgreSQL）
前往 https://neon.tech 注册，创建免费数据库。

### 2. 获取数据库连接
在 Neon Dashboard → Connection Details → 复制连接字符串
格式：`postgresql://user:password@host:5432/dbname?sslmode=require`

---

## 二、Vercel 部署步骤

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "V3.2: 登录系统 + 管理员 + 权限控制"
git remote add origin https://github.com/YOUR_USER/yunwu-brand-os.git
git push -u origin main
```

### 2. 在 Vercel 中导入项目
- 访问 https://vercel.com
- Import → Select GitHub Repo → `yunwu-brand-os`

### 3. 配置环境变量
在 Vercel Project → Settings → Environment Variables 中添加：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon 数据库连接字符串（postgresql://...） |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 生成的随机字符串 |
| `NEXTAUTH_URL` | `https://你的域名.vercel.app` |

### 4. 配置 Build Command
在 Vercel Project → Settings → General → Build Command 改为：
```
npm run vercel-build
```
（此命令会自动切换 Prisma schema 为 PostgreSQL 并生成 Client）

### 5. 部署
点击 Deploy，Vercel 自动构建并部署。

---

## 三、数据库初始化

部署完成后，在本地执行数据库迁移和种子数据：

```bash
# 设置 PostgreSQL 连接
export DATABASE_URL="你的Neon连接字符串"

# 执行迁移
npx prisma migrate deploy

# 创建管理员账号
npm run seed
```

或者直接连接 Neon 数据库执行 SQL：
1. 用 Neon SQL Editor 打开连接
2. 将 `prisma/migrations/20260618051430_pg_deploy/migration.sql` 内容粘贴执行
3. 手动插入管理员：

```sql
-- 密码为 admin123 的 bcrypt hash
INSERT INTO users (email, password, role, name)
VALUES ('admin@yunwu.com', '$2b$10$...', 'admin', 'Admin');
```

---

## 四、验证清单

- [ ] 访问 `https://你的域名/login`，看到登录页
- [ ] 邮箱 `admin@yunwu.com` + 密码 `admin123` 登录成功
- [ ] 自动跳转到 `/dashboard`
- [ ] 侧边栏显示当前用户信息
- [ ] 所有页面可正常访问
- [ ] 退出登录后重定向到登录页
- [ ] 未登录直接访问 `/dashboard` 被重定向

---

## 五、本地开发

本地开发使用 SQLite（无需配置 PostgreSQL）：

```bash
npm run dev
# 访问 http://localhost:3000
# 登录: admin@yunwu.com / admin123
```
