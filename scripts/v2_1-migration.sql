-- ═══════════════════════════════════════════════════════════
-- 允物 Brand OS V2.1 — 安全追加 SQL（仅新增，不删除）
-- 日期：2026-06-24
-- 用法：在 Neon PostgreSQL 控制台执行，或在本地执行
-- ═══════════════════════════════════════════════════════════

-- ── 1. Works 表：新增器物履历字段 ──
ALTER TABLE works ADD COLUMN IF NOT EXISTS material_origin TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS craft_method TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP;
ALTER TABLE works ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS creation_story TEXT;
ALTER TABLE works ADD COLUMN IF NOT EXISTS emotional_state TEXT;

-- ── 2. Works 表：新增时间性缓存 ──
ALTER TABLE works ADD COLUMN IF NOT EXISTS companions_count INTEGER DEFAULT 0;
ALTER TABLE works ADD COLUMN IF NOT EXISTS remaining_qty INTEGER;

-- ── 3. Products 表：新增器物履历字段 ──
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_origin TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS craft_method TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS creation_story TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS emotional_state TEXT;

-- ── 4. Products 表：新增时间性缓存 ──
ALTER TABLE products ADD COLUMN IF NOT EXISTS companions_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS remaining_qty INTEGER;

-- ── 5. CtaConfig 表 ──
CREATE TABLE IF NOT EXISTS cta_configs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  forbidden TEXT NOT NULL,
  allowed TEXT NOT NULL,
  primary_text TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 6. TermConfig 表 ──
CREATE TABLE IF NOT EXISTS term_configs (
  id SERIAL PRIMARY KEY,
  concept TEXT NOT NULL UNIQUE,
  forbidden TEXT NOT NULL,
  allowed TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 7. HomeSectionType 枚举 ──
-- PostgreSQL 需要先创建枚举类型
DO $$ BEGIN
  CREATE TYPE "HomeSectionType" AS ENUM ('SEE', 'ORIGIN', 'MEANING', 'CONNECTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 8. HomeSection 表 ──
CREATE TABLE IF NOT EXISTS home_sections (
  id SERIAL PRIMARY KEY,
  type "HomeSectionType" NOT NULL,
  sort_order INTEGER DEFAULT 0,
  featured_work_id INTEGER REFERENCES works(id),
  content TEXT,
  cta_text TEXT,
  cta_link TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 9. 验证 ──
SELECT column_name FROM information_schema.columns WHERE table_name = 'works' AND column_name IN ('material_origin', 'craft_method', 'completion_date', 'serial_number', 'creation_story', 'emotional_state', 'companions_count', 'remaining_qty');
SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name IN ('material_origin', 'companions_count', 'remaining_qty');
SELECT tablename FROM pg_tables WHERE tablename IN ('cta_configs', 'term_configs', 'home_sections');
