# 允物前台视觉系统重构设计文档 V2.0

> 基准：允物品牌宪章 / yunwu-DESIGN.md
> 目标：从 **品牌展示（Brand Showcase）** 升级为 **数字化器物空间（Digital Object Space）**
> 关键词：留白 · 时间感 · 材质感 · 仪式感 · 呼吸感
> 日期：2026-06-24

---

## 一、设计哲学

### 核心判断标准

| 现象 | 判定 |
|------|------|
| 页面看起来像高级电商 | ❌ 失败 |
| 页面看起来像独立设计师品牌官网 | ❌ 失败 |
| 页面看起来像文艺生活方式网站 | ❌ 失败 |
| 页面感觉像安静器物馆 | ✅ 通过 |
| 页面感觉像私人收藏册 | ✅ 通过 |
| 页面感觉像缓慢展开的展览空间 | ✅ 通过 |

**最终判断：用户是否会放慢阅读速度。如果会，方向正确。**

### 禁则清单（宪章映射）

| 禁则 | 来源 | 视觉表现 |
|------|------|----------|
| 不神化器物 | 宪章第五原则 | 禁止光效、发光、神圣感视觉 |
| 不承诺招财/转运/改命 | 宪章三不原则 | 禁止稀缺焦虑文案、倒计时、红色警示 |
| 不利用恐惧/焦虑 | 宪章三不原则 | 禁止紧迫感视觉：闪烁、抖动、倒计时 |
| 拒绝过度装饰 | 宪章第九篇 | 禁止装饰性边框、花纹、金色渐变 |
| 拒绝过度符号化 | 宪章第九篇 | 禁止宗教符号、神秘感图标 |
| 拒绝过度奢华 | 宪章第九篇 | 禁止金色大面积使用、高光材质 |

---

## 二、设计 Token 系统

### 2.1 色彩体系

所有颜色源于自然，而非流行趋势（宪章第九篇）。

```css
:root {
  /* ── 品牌主色（墨色系）── */
  --yun-ink:          #2C241B;     /* 松烟黑 · 主文本/主强调 */
  --yun-ink-light:    #3A2A1A;     /* 淡墨 · 辅助文本 */
  --yun-ink-muted:    #8C7660;     /* 旧墨 · 二级文本 */
  --yun-ink-faded:    #B8A898;     /* 枯墨 · 三级文本/标签 */

  /* ── 品牌辅色（土黄系）── */
  --yun-earth:        #C8A972;     /* 土黄 · 品牌唯一强调色 */
  --yun-earth-light:  #D4BA8A;     /* 浅土 · hover/微交互 */
  --yun-earth-faded:  #E8D9B5;     /* 褪土 · 分隔线/边框 */

  /* ── 底色（宣纸系）── */
  --yun-paper:        #F8F5EE;     /* 允白 · 全局底色（含宣纸感） */
  --yun-paper-warm:   #FFFBEB;     /* 温白 · 卡片/容器底色 */
  --yun-paper-aged:   #F0E8D8;     /* 老纸 · 极淡背景 */

  /* ── 功能色 ── */
  --yun-success:      #6B8E5A;     /* 青苔绿 */
  --yun-warning:      #C8A972;     /* 土黄（复用品牌色） */
  --yun-error:        #8B5E3C;     /* 老铜褐 */

  /* ── 边框 ── */
  --yun-border:       rgba(44,36,27,0.08);   /* 极淡墨线 */
  --yun-border-medium:rgba(44,36,27,0.12);   /* 中墨线 */
  --yun-border-strong:rgba(44,36,27,0.20);   /* 强墨线（仅用于履历/时间信息） */
}
```

**色彩使用规则：**

| 场景 | 允许 | 禁止 |
|------|------|------|
| 强调 | 仅土黄 `--yun-earth` | 渐变、金色、高光 |
| 背景 | 宣纸系三色 | 纯白 #FFF、纯黑 #000 |
| 文本 | 墨色系四阶 | 蓝色、红色、灰色 |
| 边框 | 三阶墨线 | 彩色边框、双线、装饰线 |

### 2.2 字体系统

宪章原则：「优先宋体与楷体精神，避免浮夸书法字体与商业化网红字体」

```css
:root {
  --yun-font-display:  "Noto Serif SC", "Source Han Serif SC", "PingFang SC", serif;
  --yun-font-body:     "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --yun-font-mono:     "JetBrains Mono", "SF Mono", monospace;

  /* 字号阶梯（物理感：大字如匾额，小字如批注） */
  --yun-text-hero:     48px;    /* 匾额 · 仅首屏标题 */
  --yun-text-title:    36px;    /* 大题 · 页面主标题 */
  --yun-text-heading:  24px;    /* 小题 · 区段标题 */
  --yun-text-body:     16px;    /* 正文 · 主体阅读 */
  --yun-text-caption:  14px;    /* 批注 · 辅助说明 */
  --yun-text-note:     12px;    /* 极批 · 时间信息/编号 */

  /* 字重（克制：最多 500，禁止 700+） */
  --yun-weight-light:  200;     /* 仅用于匾额 */
  --yun-weight-normal: 400;     /* 默认 · V2.1：避免中文发虚 */
  --yun-weight-medium: 500;     /* 仅用于行内强调 */

  /* 行高（呼吸感：宽行高模拟手卷阅读） */
  --yun-leading-tight: 1.6;     /* 仅标题 */
  --yun-leading-body:  2.0;     /* 正文 */
  --yun-leading-loose: 2.2;     /* 物语/叙事段落 */

  /* 字间距（仪式感） */
  --yun-spacing-hero:  8px;    /* 匾额字间距 · V2.1：避免展览海报感，允许 8~12px */
  --yun-spacing-title: 8px;     /* 大题字间距 */
  --yun-spacing-caption:4px;     /* 批注字间距 */
}
```

**字体规则：**

| 禁止 | 原因 |
|------|------|
| 700 以上字重 | 宪章「拒绝过度装饰」 |
| 全大写英文 | 制造广告感 |
| 下划线强调 | 制造紧迫感 |
| 红色文本 | 制造警示感 |

### 2.3 空间系统

```css
:root {
  /* 基础单元：4px（物理感：8pt grid 的东方变体） */
  --yun-space-1:   4px;
  --yun-space-2:   8px;
  --yun-space-3:   12px;
  --yun-space-4:   16px;
  --yun-space-6:   24px;      /* 正文段落间距（原 16px → 24px） */
  --yun-space-8:   32px;
  --yun-space-10:  40px;
  --yun-space-13:  52px;      /* 区段内间距 */
  --yun-space-16:  64px;
  --yun-space-26:  104px;     /* 区段间距（原 64px → 104px） */
}
```

**空间规则：**

| 场景 | 使用 | 说明 |
|------|------|------|
| 模块间距 | `--yun-space-26` (104px) | 让页面呼吸 |
| 正文段落 | `--yun-space-6` (24px) | 增加阅读节奏 |
| 组件内部 | `--yun-space-4` ~ `--yun-space-8` | 温润不拥挤 |
| 极致留白 | `--yun-space-26`+ | 首屏/区段之间 |

### 2.4 动效系统

```css
:root {
  /* 过渡（缓慢：器物不会跳起来） */
  --yun-ease-gentle:   cubic-bezier(0.25, 0.1, 0.25, 1);  /* 主过渡曲线 */
  --yun-duration-fast: 180ms;    /* 最短过渡 */
  --yun-duration-read: 280ms;    /* 阅读级过渡 */
  --yun-duration-slow: 500ms;    /* 展览级过渡 */
}
```

**动效禁则：**

| 禁止 | 原因 |
|------|------|
| `transform: scale()` | 器物不会变大 |
| `transform: translateY()` | 器物不会跳起来 |
| `box-shadow` 变化 | 器物不会发光 |
| 大面积背景色变化 | 器物不会变色 |
| `animation` 循环动效 | 器物不会循环闪烁 |

**允许：**

| 允许 | 用途 |
|------|------|
| `opacity` 变化 | 器物渐渐显现/隐去 |
| 字色变化 | 墨色→土黄的温润过渡 |
| 土黄显现 | hover 时土黄微微浮现 |

统一过渡声明：
```css
transition: color var(--yun-duration-read) var(--yun-ease-gentle),
            opacity var(--yun-duration-read) var(--yun-ease-gentle);
```

---

## 三、全局样式重构（Task 01-05 P0）

### 3.1 Task 01｜去除毛玻璃效果

**修改范围：** 导航栏、所有使用 backdrop-filter 的组件

```css
/* ❌ 禁止 */
/* backdrop-filter: blur(20px); */
/* -webkit-backdrop-filter: blur(20px); */
/* background: rgba(248,245,238,0.8); */

/* ✅ 替换为 */
.yun-nav,
.yun-header {
  background: rgba(248,245,238,0.96);
  border-bottom: 1px solid var(--yun-border);
}
```

**原则：保持温润，不制造科技感。毛玻璃是数字时代的视觉符号，与器物空间相悖。**

### 3.2 Task 02｜页面增加宣纸感

**修改范围：** 全局 page background

```css
/* ❌ 禁止 */
/* background-color: #F6F2ED; */  /* 过于平面 */

/* ✅ 替换为 */
page,
.yun-surface {
  background:
    radial-gradient(circle at 20% 30%, rgba(0,0,0,.015), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,.03), transparent 50%),
    #F8F5EE;
}
```

**规则：**
- 禁止：强纹理、可识别图案、装饰性背景
- 目标：让允白更像宣纸，不是纯色
- 实现：两层极轻 radial-gradient，模拟宣纸纤维的方向性

### 3.3 Task 03｜卡片改为作品容器

**修改范围：** 所有 card 类组件

```css
/* ❌ 当前（SaaS 化卡片） */
/* .card { */
/*   border: 1px solid var(--yun-border); */
/*   border-radius: 6px; */
/* } */

/* ✅ 作品容器 */
.yun-vessel {
  border-top: 1px solid rgba(44,36,27,.08);
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 2px;   /* V2.1：像器物边缘，非机械切割 */
  background: transparent;
  padding: var(--yun-space-6) 0;
}
```

**原则：**
- 卡片不再像 UI 组件
- 应像：册页、展签、器物承载体
- 仅上边框分隔，无圆角，无背景色
- 器物与空间之间是「承托」关系，不是「包裹」关系

### 3.4 Task 04｜重构 Hover 逻辑

**修改范围：** 所有可交互元素

```css
/* ❌ 禁止 */
/* transform: scale(1.05); */
/* transform: translateY(-4px); */
/* box-shadow: 0 8px 24px rgba(0,0,0,.12); */
/* background-color: rgba(200,169,114,.2); */

/* ✅ 允许的 hover 模式 */
.yun-vessel:hover,
.yun-link:hover {
  transition: color var(--yun-duration-read) var(--yun-ease-gentle),
              opacity var(--yun-duration-read) var(--yun-ease-gentle);
}

/* 模式 A：墨色→土黄（最常用） */
.yun-vessel:hover .yun-title {
  color: var(--yun-earth);
}

/* 模式 B：透明→微现（用于图片叠层） */
.yun-vessel:hover .yun-overlay {
  opacity: 1;
}

/* 模式 C：整体微淡（用于列表项） */
.yun-vessel:hover {
  opacity: 0.88;
}
```

**原则：器物不会跳起来。hover 应像目光缓缓移过器物，而非触碰后的弹跳。**

### 3.5 Task 05｜按钮语言系统重构

**CTA 文案替换词库：**

| 原文案（电商化） | 新文案（品牌化） | 使用场景 |
|-----------------|----------------|----------|
| 了解更多 | 观其意 | 通用探索引导 |
| 浏览全部作品 | 看诸物 | 作品列表入口 |
| 收藏作品 | 留此念 | 收藏操作 |
| 立即购买 | 结缘此物 | 购买确认 |
| 加入购物车 | 暂寄此念 | 加入购物车 |
| 产品详情 | 器物履历 | 详情入口 |
| 确认订单 | 确认缘起 | 订单确认 |
| 我的收藏 | 所留之念 | 收藏列表 |
| 购物车 | 六会 | 购物车 |
| 订单详情 | 此缘之始 | 订单详情 |

**禁止词：**

| 禁止 | 替代 |
|------|------|
| Buy now / 立即购买 | 结缘此物 |
| Add to cart / 加入购物车 | 暂寄此念 |
| Learn more / 了解更多 | 观其意 |
| Product details / 产品详情 | 器物履历 |
| Wishlist / 收藏列表 | 所留之念 |
| Checkout / 结账 | 确认缘起 |

---

## 四、二级任务设计规范（Task 06-08 P1）

### 4.1 Task 06｜器物履历模块

替换传统 Product Spec，为每件作品建立生命史。

**数据字段：**

| 字段名 | 类型 | 说明 | 视觉表现 |
|--------|------|------|----------|
| material_origin | String | 材质来源 | 「此物取材于 ××」 |
| craft_method | String | 工艺方式 | 「经 ×× 工艺而成」 |
| completion_date | Date | 完成时间 | 「完成于 ××」 |
| serial_number | String | 编号序列 | 「编号 ××」 |
| creation_story | String | 创作缘起 | 叙事段落 |
| emotional_state | String | 适配心境 | 「宜于 ×× 时」 |

**视觉规范：**

```css
.yun-provenance {
  /* 履历不使用卡片包裹，使用上边框分隔 */
  border-top: 1px solid var(--yun-border-strong);
  padding: var(--yun-space-8) 0;
}

.yun-provenance-field {
  display: flex;
  align-items: baseline;
  gap: var(--yun-space-3);
  padding: var(--yun-space-2) 0;
}

.yun-provenance-label {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  min-width: 80px;
}

.yun-provenance-value {
  font-size: var(--yun-text-caption);
  color: var(--yun-ink-muted);
}
```

**布局示意：**

```
────────── 器物履历 ──────────

  材质    此物取材于闽南老山沉香
  工艺    经传统篆刻刀法而成
  完成    完成于丙辰年仲秋
  编号    YW-CH-2024-003
  缘起    闻沉香久矣……（叙事段落）
  心境    宜于独处静思之时
```

### 4.2 Task 07｜时间性 UI

**展示模式：**

```css
.yun-temporal {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  line-height: var(--yun-leading-body);
}
```

**文案模板（强化时间感 > 稀缺感）：**

| 字段 | 模板 | 示例 |
|------|------|------|
| completion_date | 完成于 {relative_time} | 完成于三日前 |
| companions_count | 已陪伴 {n} 位同行者 | 已陪伴 17 位同行者 |
| remaining_quantity | 此批尚余 {n} 件 | 此批尚余 2 件 |

**禁止：**
- 倒计时（制造焦虑）
- 红色标注（制造紧迫）
- 「仅剩」「最后」（制造稀缺焦虑）
- 库存数字闪烁/动效

### 4.3 Task 08｜首页结构重排

**从标准品牌页 → 展览式四段结构：**

```
┌─────────────────────────────────┐
│                                 │
│  Section 01 · 见物              │
│  ─────────────────              │
│  首屏仅展示一件作品              │
│  禁止：carousel / 多列 / 滑动   │
│  像展览开场                      │
│                                 │
│  （104px 留白）                  │
│                                 │
│  Section 02 · 知其来            │
│  ─────────────────              │
│  材质来源                        │
│  地域来源                        │
│  工艺来源                        │
│  先让物成立                      │
│                                 │
│  （104px 留白）                  │
│                                 │
│  Section 03 · 知其意            │
│  ─────────────────              │
│  器物为何存在                    │
│  不是卖点，是意义                │
│                                 │
│  （104px 留白）                  │
│                                 │
│  Section 04 · 结其缘            │
│  ─────────────────              │
│  最后才允许 CTA                  │
│  结缘此物                        │
│                                 │
└─────────────────────────────────┘
```

**逻辑流：先见 → 再知 → 再懂 → 再缘**

**首屏设计（见物）：**

```css
.yun-home-see {
  /* 首屏只承载一件作品 */
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
  /* 作品图：1:1 或 4:5 比例 */
  width: min(100%, 480px);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  margin: var(--yun-space-16) 0;
}

.yun-home-temporal {
  /* 时间性信息 */
  text-align: center;
}
```

---

## 五、三级任务设计规范（Task 09-11 P2）

### 5.1 Task 09｜图片系统统一

**图片规范：**

| 要求 | 说明 |
|------|------|
| 自然光 | 禁止闪光灯/棚拍光 |
| 低饱和 | 后期降低饱和度 15-20% |
| 保留材质颗粒 | 禁止过度平滑/锐化 |
| 不锐化 | 禁止 Unsharp Mask |
| 不高对比 | 禁止高对比度处理 |

**禁止：**

| 禁止 | 原因 |
|------|------|
| AI 感产品图 | 失去材质真实感 |
| 高光爆炸 | 制造奢华感，违反宪章 |
| 电商白底图 | 制造商品感 |
| 1:1.91 比例 | 社交媒体比例，制造传播感 |

**允许比例：** 1:1 或 4:5

**CSS 实现：**

```css
.yun-image {
  aspect-ratio: 1 / 1;  /* 或 4 / 5 */
  object-fit: cover;
  filter: saturate(0.85);  /* 低饱和 */
  /* 禁止：contrast(), brightness(), sharpen */
}
```

### 5.2 Task 10｜留白扩大

| 间距项 | 当前值 | 新值 | CSS 变量 |
|--------|--------|------|----------|
| 模块间距 | 64px | 104px | `--yun-space-26` |
| 正文段落 | 16px | 24px | `--yun-space-6` |
| 首屏底部 | 64px | 104px | `--yun-space-26` |
| 区段标题前 | 40px | 64px | `--yun-space-16` |

### 5.3 Task 11｜减少边框数量

**边框使用原则：边框不是默认存在。**

| 允许使用边框的场景 | 边框规格 |
|-------------------|----------|
| 导航栏底部 | `1px solid var(--yun-border)` |
| 器物履历分隔 | `1px solid var(--yun-border-strong)` |
| 时间信息区 | `1px solid var(--yun-border-medium)` |

**禁止使用边框的场景：**

| 禁止 | 替代方案 |
|------|----------|
| 卡片四周边框 | 仅上边框 |
| 输入框边框 | 底线式（border-bottom only） |
| 列表项分隔线 | 空白间距替代 |
| 标签边框 | 无边框 + 背景色 |

**目标：减少至少 40% 边框使用量。**

---

## 六、组件库规范

### 6.1 作品容器（Vessel）替代 Card

```css
/* 基础容器 */
.yun-vessel {
  border-top: 1px solid rgba(44,36,27,.08);
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 2px;   /* V2.1：像器物边缘，非机械切割 */
  background: transparent;
  padding: var(--yun-space-6) 0;
  transition: color var(--yun-duration-read) var(--yun-ease-gentle),
              opacity var(--yun-duration-read) var(--yun-ease-gentle);
}

/* hover：标题墨→土黄 */
.yun-vessel:hover .yun-title {
  color: var(--yun-earth);
}
```

### 6.2 导航系统

```css
.yun-nav {
  background: rgba(248,245,238,0.96);
  border-bottom: 1px solid var(--yun-border);
  /* 禁止：backdrop-filter, blur, 透明渐变 */
}

.yun-nav-item {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-caption);
  color: var(--yun-ink-muted);
  letter-spacing: var(--yun-spacing-caption);
  transition: color var(--yun-duration-read) var(--yun-ease-gentle);
}

.yun-nav-item:hover,
.yun-nav-item.active {
  color: var(--yun-ink);
  /* 禁止：underline, background变化, transform */
}
```

### 6.3 按钮系统

```css
.yun-btn {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-caption);
  font-weight: var(--yun-weight-normal);
  letter-spacing: var(--yun-spacing-caption);
  padding: var(--yun-space-3) var(--yun-space-8);
  border-radius: 2px;   /* V2.1：像器物边缘，非机械切割 */
  transition: color var(--yun-duration-read) var(--yun-ease-gentle),
              background-color var(--yun-duration-read) var(--yun-ease-gentle);
  cursor: pointer;
}

/* 主按钮：墨色底 */
.yun-btn-primary {
  background: var(--yun-ink);
  color: var(--yun-paper);
  border: none;
}

.yun-btn-primary:hover {
  background: var(--yun-ink-light);
  /* 禁止：transform, shadow变化 */
}

/* 辅按钮：土黄线 */
.yun-btn-secondary {
  background: transparent;
  color: var(--yun-ink-muted);
  border: 1px solid var(--yun-earth-faded);
}

.yun-btn-secondary:hover {
  color: var(--yun-earth);
  border-color: var(--yun-earth);
}
```

### 6.4 输入框系统

```css
.yun-input {
  border: 1px solid rgba(44,36,27,0.06);
  border-radius: 2px;
  background: transparent;
  padding: var(--yun-space-3) var(--yun-space-2);
  font-size: var(--yun-text-body);
  color: var(--yun-ink);
  transition: border-color var(--yun-duration-read) var(--yun-ease-gentle);
}

.yun-input:focus {
  border-color: var(--yun-earth);
  outline: none;
  /* 禁止：box-shadow ring, 背景变化 */
}
```

### 6.5 时间信息组件

```css
.yun-temporal {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  line-height: var(--yun-leading-body);
  border-top: 1px solid var(--yun-border-medium);
  padding-top: var(--yun-space-3);
}
```

### 6.6 器物履历组件

```css
.yun-provenance {
  border-top: 1px solid var(--yun-border-strong);
  padding: var(--yun-space-8) 0 var(--yun-space-6);
}

.yun-provenance-title {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-heading);
  font-weight: var(--yun-weight-light);
  color: var(--yun-ink);
  letter-spacing: var(--yun-spacing-title);
  margin-bottom: var(--yun-space-6);
}

.yun-provenance-row {
  display: flex;
  align-items: baseline;
  gap: var(--yun-space-4);
  padding: var(--yun-space-2) 0;
}

.yun-provenance-key {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  min-width: 60px;
  text-align: right;
}

.yun-provenance-val {
  font-size: var(--yun-text-caption);
  color: var(--yun-ink-muted);
  line-height: var(--yun-leading-body);
}
```

---

## 七、独立站（Next.js）CSS 代码

### 7.1 全局 CSS 变量（globals.css）

```css
/* ═══════════════════════════════════════════
   允物 · 数字化器物空间 · 视觉系统 V2.0
   基准：允物品牌宪章
   ═══════════════════════════════════════════ */

:root {
  /* ── 色彩 ── */
  --yun-ink:          #2C241B;
  --yun-ink-light:    #3A2A1A;
  --yun-ink-muted:    #8C7660;
  --yun-ink-faded:    #B8A898;
  --yun-earth:        #C8A972;
  --yun-earth-light:  #D4BA8A;
  --yun-earth-faded:  #E8D9B5;
  --yun-paper:        #F8F5EE;
  --yun-paper-warm:   #FFFBEB;
  --yun-paper-aged:   #F0E8D8;
  --yun-success:      #6B8E5A;
  --yun-warning:      #C8A972;
  --yun-error:        #8B5E3C;
  --yun-border:       rgba(44,36,27,0.08);
  --yun-border-medium:rgba(44,36,27,0.12);
  --yun-border-strong:rgba(44,36,27,0.20);

  /* ── 字体 ── */
  --yun-font-display:  "Noto Serif SC", "Source Han Serif SC", serif;
  --yun-font-body:     "PingFang SC", "Hiragino Sans GB", sans-serif;

  /* ── 字号 ── */
  --yun-text-hero:     3rem;
  --yun-text-title:    2.25rem;
  --yun-text-heading:  1.5rem;
  --yun-text-body:     1rem;
  --yun-text-caption:  0.875rem;
  --yun-text-note:     0.75rem;

  /* ── 字重 ── */
  --yun-weight-light:  200;
  --yun-weight-normal: 400;     /* V2.1：避免中文发虚 */
  --yun-weight-medium: 500;

  /* ── 行高 ── */
  --yun-leading-tight: 1.6;
  --yun-leading-body:  2.0;
  --yun-leading-loose: 2.2;

  /* ── 字间距 ── */
  --yun-spacing-hero:  0.5rem;     /* V2.1：避免展览海报感，允许 0.5~0.75rem */
  --yun-spacing-title: 0.5rem;
  --yun-spacing-caption:0.25rem;

  /* ── 空间 ── */
  --yun-space-1:  0.25rem;
  --yun-space-2:  0.5rem;
  --yun-space-3:  0.75rem;
  --yun-space-4:  1rem;
  --yun-space-6:  1.5rem;
  --yun-space-8:  2rem;
  --yun-space-10: 2.5rem;
  --yun-space-13: 3.25rem;
  --yun-space-16: 4rem;
  --yun-space-26: 6.5rem;

  /* ── 动效 ── */
  --yun-ease-gentle:   cubic-bezier(0.25, 0.1, 0.25, 1);
  --yun-duration-fast: 180ms;
  --yun-duration-read: 280ms;
  --yun-duration-slow: 500ms;
}

/* ── 全局底色（宣纸感）── */
body {
  background:
    radial-gradient(circle at 20% 30%, rgba(0,0,0,.015), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,.03), transparent 50%),
    var(--yun-paper);
  color: var(--yun-ink);
  font-family: var(--yun-font-body);
  font-size: var(--yun-text-body);
  font-weight: var(--yun-weight-normal);
  line-height: var(--yun-leading-body);
  -webkit-font-smoothing: antialiased;
}

/* ── 导航（禁止毛玻璃）── */
.yun-nav {
  background: rgba(248,245,238,0.96);
  border-bottom: 1px solid var(--yun-border);
  position: sticky;
  top: 0;
  z-index: 50;
}

/* ── 过渡统一 ── */
.yun-transition {
  transition: color var(--yun-duration-read) var(--yun-ease-gentle),
              opacity var(--yun-duration-read) var(--yun-ease-gentle);
}
```

### 7.2 响应式补充

```css
/* 移动端基础（320px - 639px） */
@media (max-width: 639px) {
  :root {
    --yun-text-hero:   2rem;
    --yun-text-title:  1.5rem;
    --yun-text-heading:1.25rem;
    --yun-space-26:    4rem;
  }
}

/* 平板（640px - 1023px） */
@media (min-width: 640px) and (max-width: 1023px) {
  :root {
    --yun-text-hero:   2.5rem;
    --yun-space-26:    5rem;
  }
}

/* 桌面（1024px+） */
@media (min-width: 1024px) {
  :root {
    --yun-text-hero:   3rem;
    --yun-space-26:    6.5rem;
  }
}
```

---

## 八、小程序（WeChat）wxss 代码

### 8.1 app.wxss 全局重构

```css
/* ========== 允物 V5.0 · 数字化器物空间 ========== */

/* 设计理念：东方器物叙事 / 策展式浏览 / 禁止电商促销 */
/* V5.0 重构：去除毛玻璃 / 宣纸感底色 / 作品容器 / 缓慢动效 */

page {
  /* ── 色彩体系 ── */
  --yun-ink:          #2C241B;
  --yun-ink-light:    #3A2A1A;
  --yun-ink-muted:    #8C7660;
  --yun-ink-faded:    #B8A898;
  --yun-earth:        #C8A972;
  --yun-earth-light:  #D4BA8A;
  --yun-earth-faded:  #E8D9B5;
  --yun-paper:        #F8F5EE;
  --yun-paper-warm:   #FFFBEB;
  --yun-paper-aged:   #F0E8D8;
  --yun-success:      #6B8E5A;
  --yun-error:        #8B5E3C;
  --yun-border:       rgba(44,36,27,0.08);
  --yun-border-medium:rgba(44,36,27,0.12);
  --yun-border-strong:rgba(44,36,27,0.20);

  /* ── 字号阶梯 ── */
  --yun-text-hero:     48rpx;
  --yun-text-title:    36rpx;
  --yun-text-heading:  28rpx;
  --yun-text-body:     26rpx;
  --yun-text-caption:  22rpx;
  --yun-text-note:     20rpx;

  /* ── 字重（克制）── */
  --yun-weight-light:  200;
  --yun-weight-normal: 400;     /* V2.1：避免中文发虚 */
  --yun-weight-medium: 500;

  /* ── 行高 ── */
  --yun-leading-tight: 1.6;
  --yun-leading-body:  2.0;
  --yun-leading-loose: 2.2;

  /* ── 字间距 ── */
  --yun-spacing-hero:  8rpx;     /* V2.1：避免展览海报感 */
  --yun-spacing-title: 8rpx;
  --yun-spacing-caption:4rpx;

  /* ── 空间（V5.0 扩大留白）── */
  --yun-space-1:  8rpx;
  --yun-space-2:  16rpx;
  --yun-space-3:  24rpx;
  --yun-space-4:  32rpx;
  --yun-space-6:  48rpx;      /* 正文段落：原 24rpx → 48rpx */
  --yun-space-8:  64rpx;
  --yun-space-10: 80rpx;
  --yun-space-13: 104rpx;
  --yun-space-16: 128rpx;
  --yun-space-26: 208rpx;     /* 区段间距：原 64rpx → 208rpx */

  /* ── 动效 ── */
  --yun-ease-gentle:   cubic-bezier(0.25, 0.1, 0.25, 1);
  --yun-duration-read: 280ms;

  /* ── 全局底色（宣纸感，禁止纯平面）── */
  background:
    radial-gradient(circle at 20% 30%, rgba(0,0,0,.015), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,.03), transparent 50%),
    #F8F5EE;
  color: var(--yun-ink);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: var(--yun-text-body);
  font-weight: var(--yun-weight-normal);
  line-height: var(--yun-leading-body);
}
```

### 8.2 作品容器组件（替代 Card）

```css
/* ========== 作品容器 · Vessel ========== */
/* 替代所有 card 类：册页/展签/器物承载体 */

.yun-vessel {
  border-top: 1rpx solid rgba(44,36,27,0.08);
  border-left: none;
  border-right: none;
  border-bottom: none;
  border-radius: 2px;   /* V2.1：像器物边缘，非机械切割 */
  background: transparent;
  padding: var(--yun-space-6) 0;
  transition: color var(--yun-duration-read) var(--yun-ease-gentle),
              opacity var(--yun-duration-read) var(--yun-ease-gentle);
}

.yun-vessel-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  /* 禁止：border-radius, border */
}

.yun-vessel-title {
  font-family: var(--yun-font-display);
  font-size: var(--yun-text-heading);
  font-weight: var(--yun-weight-normal);
  color: var(--yun-ink);
  letter-spacing: var(--yun-spacing-title);
  margin-top: var(--yun-space-3);
  transition: color var(--yun-duration-read) var(--yun-ease-gentle);
}

.yun-vessel:hover .yun-vessel-title {
  color: var(--yun-earth);
}

.yun-vessel-temporal {
  font-size: var(--yun-text-note);
  color: var(--yun-ink-faded);
  letter-spacing: var(--yun-spacing-caption);
  margin-top: var(--yun-space-2);
}
```

---

## 九、验收自查表

| 检查项 | 通过标准 |
|--------|----------|
| 页面看起来像高级电商？ | ❌ 必须不是 |
| 页面看起来像品牌官网？ | ❌ 必须不是 |
| 页面感觉像安静器物馆？ | ✅ 必须是 |
| 有毛玻璃效果？ | ❌ 必须无 |
| 底色是纯色？ | ❌ 必须有宣纸感 |
| 卡片有四边框+圆角？ | ❌ 必须仅上边框无圆角 |
| hover 有 scale/translateY？ | ❌ 必须仅 color/opacity |
| CTA 使用 Buy/Add/Learn？ | ❌ 必须使用品牌词库 |
| 模块间距 ≤ 64px？ | ❌ 必须 ≥ 104px |
| 边框数量与旧版持平？ | ❌ 必须减少 ≥ 40% |
| 用户会放慢阅读速度？ | ✅ 必须是 |

---

**设计系统文档 · 完**
**UI Designer**
**日期：2026-06-24**
