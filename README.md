# 男性觉醒 · 生存与维权手册

一个纯静态、无广告、无课程的中文长读站点：写给普通男性的自我教育与维权常识手册。

- **定位**：看懂亲密关系里的真实成本，学会用法律和常识保护自己。不仇视任何性别——反对的是利用信息差、情感依赖与法律盲区实施的剥削。
- **内容**：7 篇长文 + 附录工具包 + 热点发布页，全文约 10.6 万中文字，68 个案例拆解（匿名化改编）、41 条法条与司法解释要旨。
- **检索**：内置全站搜索（Ctrl/⌘ + K 或点顶栏搜索），按小节建索引，直接跳到锚点。
- **成本**：零依赖、零构建链，纯 HTML/CSS/JS。

## 章节

| 文件 | 内容 |
|---|---|
| `index.html` | 首页与阅读路径导航 |
| `ch01.html` | 认知觉醒：力工、刀工与情感剥削链条 |
| `ch02.html` | 金钱与返还：恋爱支出、彩礼、婚内财产、欺诈性抚养 |
| `ch03.html` | 及时止损：沉没成本、红旗信号、财务切割 |
| `ch04.html` | 识别与取证：钓鱼、出轨、亲子鉴定、合法取证边界 |
| `ch05.html` | 维权实操：证据体系、报警、保全、诉讼、执行 |
| `ch06.html` | 爱自己：体检、训练、营养、做饭、护肤、财务、心理 |
| `ch07.html` | 关系重建：边界、沟通、婚前十二问、财产约定 |
| `appendix.html` | 法条速查、证据清单、40 条量表、FAQ、行动卡 |
| `hot.html` | 热点·权威发布：官方大事记、涉彩礼新规、解释（二）要点、数据图 |

## 目录结构

```
.
├── index.html … appendix.html   # 构建产物（直接部署这份）
├── assets/                      # css / js / favicon
├── _src/                        # 内容源（片段 + 版式 + 写作规范）
│   ├── layout.html, layout-index.html
│   ├── SPEC.md                  # 写作规范
│   └── content/*.html           # 各章节内容分片
├── _build/build.py              # 构建脚本
└── .github/workflows/pages.yml  # GitHub Pages 自动部署
```

## 本地预览

```bash
python -m http.server 8000 --directory .
# 浏览器打开 http://localhost:8000
```

## 重新构建

内容改动在 `_src/content/` 里做，然后：

```bash
python _build/build.py
```

脚本会自动套版式、生成目录侧栏、编号小节并统计全站字数。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（公开或私人均可，公开才能用免费 Pages，或用 Actions 部署的私有 Pages）。
2. 推送本目录：

```bash
cd male-awakening
git init -b main
git add .
git commit -m "init: 男性觉醒手册全站"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

3. 仓库 **Settings → Pages → Source** 选 `GitHub Actions`。
4. 推送后 Actions 会自动部署，几分钟后访问 `https://<用户名>.github.io/<仓库名>/`。

内链均为相对路径，任何子路径托管均正常工作。

## 免责声明

本站内容为普法与生活常识整理，不构成法律意见。法律适用因个案事实、证据与地域裁判尺度而异，涉及具体纠纷请委托执业律师。文中案例均为公开裁判思路的匿名化改写，不代表任何真实个案完整事实。
