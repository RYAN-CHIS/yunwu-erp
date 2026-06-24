# 允物首页结构重排设计文档

> 基准：允物品牌宪章 · Task 08
> 目标：从标准品牌页 → 展览式四段结构
> 原则：先见 → 再知 → 再懂 → 再缘
> 日期：2026-06-24

---

## 一、设计哲学

**宪章映射：**

品牌宪章明确指出「器物不改变命运，器物提醒人如何面对命运」。首页必须体现这一层次关系：

1. 用户先**见到**一件器物（见物）
2. 然后了解它从**何而来**（知其来）
3. 再理解它为何**存在**（知其意）
4. 最后才是人与器物的**相遇**（结其缘）

**禁止：** carousel / 多列产品墙 / 滑动推荐 / 首屏 CTA

---

## 二、四段结构详解

### Section 01 · 见物

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         [一件作品的图片]          │
│          1:1 或 4:5 比例          │
│         低饱和 · 自然光           │
│                                 │
│                                 │
│        「作品名」                 │
│        匾额级字号                 │
│        字间距 24px               │
│                                 │
│     完成于三日前 · 已陪伴17位同行者 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**规则：**
- 首屏仅展示一件作品
- 禁止：carousel、多列产品墙、滑动推荐
- 像展览开场：第一眼只看见一件器物
- 作品由后台 HomeSection.featuredWorkId 配置
- 时间性信息极轻地出现在作品名下方

**CSS 组件：**

```css
.yun-home-see {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--yun-space-26) var(--yun-space-4);
}

.yun-home-work-name {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-hero);
  font-weight: var(--yun-weight-light);
  color: var(--yun-ink);
  letter-spacing: var(--yun-spacing-hero);
  text-align: center;
}

.yun-home-work-image {
  width: min(100%, 480px);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  filter: saturate(0.85);
  margin: var(--yun-space-16) 0;
}

.yun-home-temporal {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  text-align: center;
  margin-top: var(--yun-space-4);
}
```

### Section 02 · 知其来

```
┌─────────────────────────────────┐
│                                 │
│  （104px 留白）                  │
│                                 │
│  知其来                          │
│                                 │
│  ─── 材质 ───                   │
│  此物取材于闽南老山沉香           │
│                                 │
│  ─── 地域 ───                   │
│  来自闽南 · 郑成功故里            │
│                                 │
│  ─── 工艺 ───                   │
│  经传统篆刻刀法而成              │
│                                 │
│  先让物成立                      │
│                                 │
└─────────────────────────────────┘
```

**规则：**
- 展示材质来源、地域来源、工艺来源
- 目标：先让物成立，让用户理解器物的物质基础
- 禁止：卖点罗列、参数表、对比表格
- 每条信息用上边框分隔，如册页标注

**CSS 组件：**

```css
.yun-home-origin {
  padding: var(--yun-space-26) var(--yun-space-4);
}

.yun-home-origin-title {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-heading);
  font-weight: var(--yun-weight-light);
  color: var(--yun-ink);
  letter-spacing: var(--yun-spacing-title);
  margin-bottom: var(--yun-space-8);
}

.yun-origin-row {
  display: flex;
  align-items: baseline;
  gap: var(--yun-space-4);
  padding: var(--yun-space-3) 0;
  border-top: 1px solid var(--yun-border);
}

.yun-origin-key {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  min-width: 60px;
  text-align: right;
}

.yun-origin-val {
  font-size: var(--yun-text-body);
  color: var(--yun-ink-muted);
  line-height: var(--yun-leading-body);
}
```

### Section 03 · 知其意

```
┌─────────────────────────────────┐
│                                 │
│  （104px 留白）                  │
│                                 │
│  知其意                          │
│                                 │
│  ┌───────────────────────┐      │
│  │                       │      │
│  │  （叙事段落）           │      │
│  │                       │      │
│  │  器物为何存在。         │      │
│  │  不是卖点。是意义。     │      │
│  │                       │      │
│  │  宽行高 2.2            │      │
│  │  首行缩进 2em          │      │
│  │  两端对齐              │      │
│  │                       │      │
│  └───────────────────────┘      │
│                                 │
└─────────────────────────────────┘
```

**规则：**
- 展示器物为何存在
- 不是卖点罗列，是意义叙述
- 叙事段落使用宽行高 (2.2) + 首行缩进 + 两端对齐
- 模拟手卷阅读感
- 禁止：功能列表、参数对比、卖点卡片

**CSS 组件：**

```css
.yun-home-meaning {
  padding: var(--yun-space-26) var(--yun-space-4);
}

.yun-home-meaning-title {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-heading);
  font-weight: var(--yun-weight-light);
  color: var(--yun-ink);
  letter-spacing: var(--yun-spacing-title);
  margin-bottom: var(--yun-space-8);
}

.yun-meaning-text {
  font-size: var(--yun-text-body);
  color: var(--yun-ink-muted);
  line-height: var(--yun-leading-loose);     /* 2.2 */
  text-indent: 2em;
  text-align: justify;
  max-width: 640px;
  margin: 0 auto;
}
```

### Section 04 · 结其缘

```
┌─────────────────────────────────┐
│                                 │
│  （104px 留白）                  │
│                                 │
│  结其缘                          │
│                                 │
│         [结缘此物]               │
│         墨色底 · 无圆角           │
│         字间距 4px               │
│                                 │
│  （104px 留白）                  │
│                                 │
└─────────────────────────────────┘
```

**规则：**
- 最后才允许 CTA
- CTA 文案：结缘此物（禁止：立即购买/加入购物车）
- 按钮样式：墨色底 · 无圆角 · 无阴影
- hover 仅墨→淡墨，禁止 scale/shadow
- 整体克制，不制造紧迫感

**CSS 组件：**

```css
.yun-home-cta {
  padding: var(--yun-space-26) var(--yun-space-4);
  text-align: center;
}

.yun-cta-heading {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-heading);
  font-weight: var(--yun-weight-light);
  color: var(--yun-ink);
  letter-spacing: var(--yun-spacing-title);
  margin-bottom: var(--yun-space-8);
}

.yun-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-caption);
  font-weight: var(--yun-weight-normal);
  letter-spacing: var(--yun-spacing-caption);
  padding: var(--yun-space-6) var(--yun-space-13);
  background: var(--yun-ink);
  color: var(--yun-paper);
  border-radius: 0;
  text-decoration: none;
  transition: background-color var(--yun-duration-read) var(--yun-ease-gentle);
}

.yun-cta-btn:hover {
  background: var(--yun-ink-light);
}
```

---

## 三、小程序首页布局

小程序首屏同样遵循四段结构，但需适配竖屏浏览：

```
┌─────────────┐
│             │
│  见物       │
│             │
│  [作品图]   │
│  1:1比例    │
│  max 480rpx │
│             │
│  作品名     │
│  匾额字号   │
│             │
│  时间信息   │
│             │
│ (208rpx)    │
│             │
│  知其来     │
│             │
│  材质来源   │
│  工艺来源   │
│             │
│ (208rpx)    │
│             │
│  知其意     │
│             │
│  叙事段落   │
│             │
│ (208rpx)    │
│             │
│  结其缘     │
│             │
│  [结缘此物] │
│             │
└─────────────┘
```

---

## 四、后台配置说明

首页 CMS 模块结构（HomeSection 表）：

| 区段 | type | 可配置项 | 默认值 |
|------|------|----------|--------|
| 见物 | SEE | featuredWorkId（指定一件作品） | 最新置顶作品 |
| 知其来 | ORIGIN | content（富文本/自动取自作品履历） | 自动从作品履历生成 |
| 知其意 | MEANING | content（叙事文本） | 作品 story 字段 |
| 结其缘 | CONNECTION | ctaText / ctaLink | 「结缘此物」→ 作品详情页 |

**排序规则：** sortOrder 固定为 1-4，禁止重排。
**发布控制：** 每个 section 可独立 isPublished，但禁止跳过前序区段直接发布结缘区段。

---

## 五、验收标准

| 检查项 | 标准 |
|--------|------|
| 首屏有 carousel？ | ❌ 必须无 |
| 首屏有多列产品？ | ❌ 必须无 |
| 首屏有 CTA？ | ❌ 必须在第四段 |
| 四段顺序可改？ | ❌ 固定见→来→意→缘 |
| 用户看完首屏会想往下？ | ✅ 像展览引导 |
| 整体阅读速度变慢？ | ✅ 核心指标 |

---

**首页结构重排设计 · 完**
**UI Designer**
**日期：2026-06-24**
