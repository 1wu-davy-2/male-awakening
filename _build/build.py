# -*- coding: utf-8 -*-
"""
静态站构建脚本：把 _src/content/*.html 片段套进版式，生成整站 HTML。
用法： python _build/build.py
"""
import os
import re
import sys
import json
from string import Template

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_src")
CONTENT = os.path.join(SRC, "content")

# 版本号规则：每次升级只 +0.1（v1.3 → v1.4 → v1.5 …），改这里即可，页脚自动同步
VERSION = "v1.4"

# slug, 导航短名, kicker, h1, lede, 副标题
PAGES = [
    dict(slug="index", nav="首页", kicker="", h1="", lede="",
         title="男性觉醒 · 生存与维权手册",
         desc="写给普通男性的自我教育与维权常识手册：看懂关系成本、守住钱包、及时止损、合法取证、理性维权，以及如何真正开始爱自己。"),
    dict(slug="ch01", nav="一 · 认知", kicker="第一篇 · 认知觉醒",
         h1="你不是不够好，你是被放在了提款机的位置上",
         lede="关系里的剥削从来不是一拳打倒，而是一层层试探、加码、固化。看懂这条链条的每一环，你才知道自己是哪一步开始输的。",
         title="认知觉醒：力工、刀工与情感剥削的完整链条 | 男性觉醒",
         desc="拆解男性在亲密关系中被工具化的四个阶段：试探、加码、固化、清算，识别养鱼、备胎池、情绪勒索与煤气灯操纵。"),
    dict(slug="ch02", nav="二 · 金钱", kicker="第二篇 · 金钱与返还",
         h1="花出去的钱，哪些能要回来，怎么要",
         lede="恋爱支出、彩礼、婚内财产、欺诈性抚养费 —— 四种性质，四套规则，四种打法。搞错定性，钱一分都要不回来。",
         title="恋爱支出、彩礼与婚内财产：男性如何合法追回 | 男性觉醒",
         desc="彩礼返还的法定情形、520转账与借贷的区分、婚内财产分割、欺诈性抚养索赔，附证据清单与诉讼路径。"),
    dict(slug="ch03", nav="三 · 止损", kicker="第三篇 · 及时止损",
         h1="止损不是认输，是把剩余本金拿回来",
         lede="所有赌徒都死在“再投一点就能回本”这句话上。感情里的沉没成本，比股市更狠 —— 因为它连收盘价都不告诉你。",
         title="及时止损：识别该走的信号与干净的退出方式 | 男性觉醒",
         desc="沉没成本陷阱、30条红旗信号、分手时的财务切割清单、人身安全保护与报复风险处置。"),
    dict(slug="ch04", nav="四 · 识别", kicker="第四篇 · 识别与取证",
         h1="钓鱼、出轨、孩子不是你的：怎么看，怎么证",
         lede="怀疑不解决问题，证据才解决。但取证有边界 —— 越界的证据不但无效，还可能让你从原告变成被告。",
         title="识别钓鱼与出轨、亲子鉴定与合法取证边界 | 男性觉醒",
         desc="钓钱、钓情绪、钓资源三类套路识别，出轨的法律后果，民法典1073条亲子关系异议之诉，合法与非法取证的界线。"),
    dict(slug="ch05", nav="五 · 维权", kicker="第五篇 · 维权实操",
         h1="从报警到开庭：一个人的维权操作手册",
         lede="维权不是拼命，是拼流程。先固定证据，再谈判，最后诉讼 —— 顺序错了，全盘皆输。",
         title="维权实操：报警、起诉、财产保全与刑事自诉全流程 | 男性觉醒",
         desc="证据体系搭建、电子数据固定、报警场景清单、起诉状要素与管辖、财产保全、重婚罪自诉、被诬告时的自保。"),
    dict(slug="ch06", nav="六 · 爱自己", kicker="第六篇 · 爱自己",
         h1="把给别人的那份认真，分一半给自己",
         lede="身体、饭桌、皮肤、肌肉、房间、账户 —— 这六件事撑起一个人的底盘。底盘稳了，谁走都塌不了。",
         title="男性自我照顾：健身、做饭、护肤、财务与心理 | 男性觉醒",
         desc="男性体检清单、12周力量训练计划、三餐蛋白质配比、零失败菜谱、护肤三步法、应急金与保险配置、孤独感处理。"),
    dict(slug="ch07", nav="七 · 重建", kicker="第七篇 · 关系重建",
         h1="不剥削别人，也不被别人剥削",
         lede="清醒的终点不是独身，是有能力建立一段账目清楚、边界清晰、双方都不吃亏的关系。",
         title="健康亲密关系：边界、沟通与婚前必谈的12个问题 | 男性觉醒",
         desc="健康边界的建立、平等关系的信号、非暴力沟通、婚前财产约定与必谈清单、冲突处理与分手伦理。"),
    dict(slug="appendix", nav="附录", kicker="附录 · 工具包",
         h1="带走就能用的东西",
         lede="法条速查、证据清单、自查量表、训练表、菜谱、术语表 —— 不用通读全文，需要时直接翻这里。",
         title="附录：法条速查、证据清单与工具模板 | 男性觉醒",
         desc="民法典婚姻家庭编条文速查、维权证据清单模板、情感剥削自查量表、12周训练表、一周菜谱、网络黑话术语表。"),
    dict(slug="hot", nav="热点发布", kicker="热点 · 权威发布",
         h1="法院和官方机构最近发布了什么",
         lede="把婚恋家事领域的官方发布按时间排成一条线：涉彩礼新规、婚姻家庭编解释（二）、权威数据与检索入口，附信息图。",
         title="热点·权威发布：涉彩礼新规、婚姻家庭编解释（二）与官方大事记 | 男性觉醒",
         desc="跟踪最高人民法院、民政部等官方机构在婚恋家事领域的发布：2016-2025大事记、涉彩礼司法解释（2024施行）、婚姻家庭编解释（二）（2025施行）要点解读与权威数据。"),
]

NAV_TPL = '<a href="{slug}.html"{active}>{nav}</a>'


def read(path):
    if not os.path.exists(path):
        print("  [MISS] " + path)
        return ""
    with open(path, encoding="utf-8") as f:
        return f.read()


def load_content(slug):
    """支持单文件 slug.html，或分片 sluga.html / slugb.html / slugc.html"""
    single = os.path.join(CONTENT, slug + ".html")
    if os.path.exists(single):
        return read(single)
    parts = []
    for suf in ("a", "b", "c", "d"):
        p = os.path.join(CONTENT, slug + suf + ".html")
        if os.path.exists(p):
            parts.append(read(p))
    if not parts:
        print("  [MISS] content for " + slug)
    return "\n".join(parts)


def cjk_count(text):
    """统计中日韩统一表意文字数量（近似“字数”）"""
    return len(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff]", text))


def strip_tags(html):
    return re.sub(r"<[^>]+>", "", html)


def collect_headings(html):
    """返回 [(level, id, text)]"""
    out = []
    for m in re.finditer(r"<h([23])([^>]*)>(.*?)</h\1>", html, re.S | re.I):
        level = int(m.group(1))
        attrs = m.group(2)
        text = strip_tags(m.group(3)).strip()
        idm = re.search(r'id="([^"]+)"', attrs)
        hid = idm.group(1) if idm else ""
        out.append((level, hid, text))
    return out


def build_toc(headings):
    """按 h2 分组生成目录；h3 只在当前节展开（CSS 控制），避免侧栏变成一堵墙。"""
    groups = []
    for level, hid, text in headings:
        if not hid:
            continue
        if level == 2:
            groups.append({"id": hid, "text": text, "subs": []})
        elif level == 3 and groups:
            groups[-1]["subs"].append({"id": hid, "text": text})

    if not groups:
        return '<p class="side-title">本章目录 <span>0 节</span></p><ol class="toc"></ol>'

    items = []
    for i, g in enumerate(groups, 1):
        active = " is-active is-open" if i == 1 else ""
        subs = ""
        if g["subs"]:
            subs = (
                '<ul class="toc-sub">'
                + "".join('<li><a href="#%s">%s</a></li>' % (s["id"], s["text"]) for s in g["subs"])
                + "</ul>"
            )
        items.append(
            '<li class="toc-item%s"><a class="toc-link" href="#%s"><i>%02d</i><span>%s</span></a>%s</li>'
            % (active, g["id"], i, g["text"], subs)
        )
    return (
        '<p class="side-title">本章目录 <span>%d 节</span></p>\n      <ol class="toc">\n        %s\n      </ol>'
        % (len(groups), "\n        ".join(items))
    )


def page_stats(html):
    """单页统计：字数、阅读时长、案例数与法条数"""
    words = cjk_count(strip_tags(html))
    return {
        "words": words,
        "words_text": ("%.1f 万" % (words / 10000.0)) if words >= 10000 else "{:,}".format(words),
        "minutes": max(1, int(round(words / 380.0))),
        "cases": len(re.findall(r'class="case"', html)),
        "laws": len(re.findall(r'class="law"', html)),
    }


def build_meta(st):
    parts = [
        "<li><b>%s</b> 字</li>" % st["words_text"],
        "<li>约 <b>%d</b> 分钟</li>" % st["minutes"],
    ]
    if st["cases"]:
        parts.append("<li><b>%d</b> 个案例</li>" % st["cases"])
    if st["laws"]:
        parts.append("<li><b>%d</b> 条法条</li>" % st["laws"])
    return "".join(parts)


def build_search_index(contents):
    """按 h2 小节切分生成检索条目，前端做子串匹配。"""
    entries = []
    for p in PAGES:
        if p["slug"] == "index":
            continue
        html = contents[p["slug"]]
        ms = list(re.finditer(r"<h2([^>]*)>(.*?)</h2>", html, re.S | re.I))
        for i, m in enumerate(ms):
            hid_m = re.search(r'id="([^"]+)"', m.group(1))
            if not hid_m:
                continue
            start = m.end()
            end = ms[i + 1].start() if i + 1 < len(ms) else len(html)
            body = re.sub(r"\s+", " ", strip_tags(html[start:end])).strip()
            title = re.sub(r"\s+", " ", strip_tags(m.group(2))).strip()
            # 跳过"本章要点"这类无检索价值的节
            if not title or title in ("本章要点",):
                continue
            entries.append({
                "p": p["slug"],
                "n": p["nav"],
                "t": title,
                "a": hid_m.group(1),
                "x": body[:110],
            })
    js = "window.SEARCH_INDEX=" + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n"
    dest = os.path.join(ROOT, "assets", "js", "search-index.js")
    with open(dest, "w", encoding="utf-8") as f:
        f.write(js)
    return len(entries)


def build_pagenav(idx):
    prev_p = PAGES[idx - 1] if idx > 0 else None
    next_p = PAGES[idx + 1] if idx + 1 < len(PAGES) else None
    left = (
        '<a class="prev" href="%s.html"><small>上一篇</small><b>%s</b></a>'
        % (prev_p["slug"], prev_p["nav"])
        if prev_p
        else "<span></span>"
    )
    right = (
        '<a class="next" href="%s.html"><small>下一篇</small><b>%s</b></a>'
        % (next_p["slug"], next_p["nav"])
        if next_p
        else "<span></span>"
    )
    return '<nav class="pagenav">%s%s</nav>' % (left, right)


def main():
    tpl_page = Template(read(os.path.join(SRC, "layout.html")))
    tpl_index = Template(read(os.path.join(SRC, "layout-index.html")))

    # 第一遍：读内容 + 统计总字数与全站规模
    contents = {}
    total = 0
    total_cases = 0
    total_laws = 0
    total_sections = 0
    for p in PAGES:
        html = load_content(p["slug"])
        contents[p["slug"]] = html
        total += cjk_count(strip_tags(html))
        if p["slug"] != "index":
            total_cases += len(re.findall(r'class="case"', html))
            total_laws += len(re.findall(r'class="law"', html))
            total_sections += len(re.findall(r"<h2", html))

    report = []
    for i, p in enumerate(PAGES):
        html = contents[p["slug"]]
        heads = collect_headings(html)

        # 给 h2 补序号
        counter = [0]

        def add_num(m):
            counter[0] += 1
            attrs = m.group(1)
            if "data-num" not in attrs:
                attrs += ' data-num="%02d"' % counter[0]
            return "<h2%s>" % attrs

        html = re.sub(r"<h2([^>]*)>", add_num, html)

        nav = "".join(
            NAV_TPL.format(slug=q["slug"], active=' class="is-active"' if q["slug"] == p["slug"] else "", nav=q["nav"])
            for q in PAGES
        )

        common = dict(
            TITLE=p["title"],
            DESC=p["desc"],
            NAV=nav,
            VERSION=VERSION,
            WORDS="{:,.0f}".format(total),
            TOTAL_CASES=str(total_cases),
            TOTAL_LAWS=str(total_laws),
            TOTAL_SECTIONS=str(total_sections),
        )

        if p["slug"] == "index":
            out = tpl_index.substitute(CONTENT=html, **common)
        else:
            st = page_stats(html)
            out = tpl_page.substitute(
                CONTENT=html,
                SIDE=build_toc(heads),
                META=build_meta(st),
                PAGENAV=build_pagenav(i),
                KICKER=p["kicker"],
                H1=p["h1"],
                LEDE=p["lede"],
                **common
            )

        dest = os.path.join(ROOT, p["slug"] + ".html")
        with open(dest, "w", encoding="utf-8") as f:
            f.write(out)
        n = cjk_count(strip_tags(html))
        report.append((p["slug"], n))
        print("  生成 %-12s %7d 字" % (p["slug"] + ".html", n))

    n_idx = build_search_index(contents)
    print("  生成检索索引 %d 条 -> assets/js/search-index.js" % n_idx)
    print("  全站：%d 个案例 · %d 条法条 · %d 个章节小节" % (total_cases, total_laws, total_sections))

    print("\n合计中文字数：%d" % total)
    if total < 100000:
        print("!! 不足 10 万字，还差 %d 字" % (100000 - total))
    else:
        print("OK 已超过 10 万字")
    return total


if __name__ == "__main__":
    sys.exit(0 if main() >= 100000 else 1)
