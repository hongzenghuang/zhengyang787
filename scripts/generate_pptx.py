#!/usr/bin/env python3
"""生成 787 飞行模拟器参赛演讲 PPTX（纯标准库，无第三方依赖）。

输出：项目根目录《波音787飞行模拟器-参赛演讲.pptx》
结构：11 页 16:9，暗色驾驶舱风格，每页附演讲者备注（含建议用时）。
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '波音787飞行模拟器-参赛演讲.pptx')
COVER_IMG = os.path.join(ROOT, 'public/images/img_20261122_133322_134193.jpg')

EMU = 914400
SLIDE_W = 12192000
SLIDE_H = 6858000

BG = '04070C'
PANEL = '0B1520'
PANEL2 = '0E2233'
CYAN = '50D7FF'
WHITE = 'EAF4FB'
MUTED = '9FB9C9'
DIM = '8193A8'
GREEN = '4EC98A'
AMBER = 'F0B429'
RED = 'FF6B6B'
LINE = '1D3245'

FONT = 'Microsoft YaHei'


def esc(t: str) -> str:
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def run_xml(t, size, color, bold=False, spc=None):
    b = ' b="1"' if bold else ''
    sp = f' spc="{spc}"' if spc else ''
    return (
        f'<a:r><a:rPr lang="zh-CN" altLang="en-US" sz="{int(size * 100)}"{b}{sp} dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:rPr>'
        f'<a:t>{esc(t)}</a:t></a:r>'
    )


def para_xml(runs, align='l', bullet=False, space_before=0, line_spc=None, indent=0):
    """runs: list of (text,size,color,bold) 或 (text,size,color,bold,spc)"""
    algn = {'l': 'l', 'c': 'ctr', 'r': 'r'}[align]
    ppr = f'<a:pPr marL="{342900 if bullet else 0}" indent="{-228600 if bullet else 0}" algn="{algn}"'
    if indent:
        ppr = f'<a:pPr marL="{342900 + indent}" indent="-228600" algn="{algn}"'
    if space_before:
        ppr += f'><a:spcBef><a:spcPts val="{int(space_before * 100)}"/></a:spcBef>'
    else:
        ppr += '>'
    if line_spc:
        ppr += f'<a:lnSpc><a:spcPct val="{int(line_spc * 1000)}"/></a:lnSpc>'
    if bullet:
        ppr += f'<a:buFont typeface="Arial"/><a:buChar char="▪"/>'
    else:
        ppr += '<a:buNone/>'
    ppr += '</a:pPr>'
    body = ''.join(run_xml(*r) for r in runs)
    return f'<a:p>{ppr}{body}</a:p>'


class IdGen:
    def __init__(self):
        self.n = 1

    def next(self):
        self.n += 1
        return self.n


def sp_rect(gen, x, y, w, h, fill=None, line=None, line_w=12700, alpha=None, round_=False):
    sid = gen.next()
    geom = 'roundRect' if round_ else 'rect'
    fill_xml = '<a:noFill/>' if fill is None else (
        f'<a:solidFill><a:srgbClr val="{fill}">'
        + (f'<a:alpha val="{int(alpha * 1000)}"/>' if alpha else '')
        + '</a:srgbClr></a:solidFill>')
    line_xml = '<a:ln><a:noFill/></a:ln>' if line is None else (
        f'<a:ln w="{line_w}"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill></a:ln>')
    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Rect {sid}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom>{fill_xml}{line_xml}</p:spPr>'
        f'<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="zh-CN"/></a:p></p:txBody></p:sp>'
    )


def sp_text(gen, x, y, w, h, paras, anchor='t'):
    sid = gen.next()
    body = ''.join(paras)
    return (
        f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="Text {sid}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
        f'<p:txBody><a:bodyPr wrap="square" anchor="{anchor}"><a:normAutofit/></a:bodyPr>'
        f'<a:lstStyle/>{body}</p:txBody></p:sp>'
    )


def sp_pic(gen, rid, x, y, w, h, name='Picture'):
    sid = gen.next()
    return (
        f'<p:pic><p:nvPicPr><p:cNvPr id="{sid}" name="{name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
        f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
        f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'
    )


def P(t, size, color, bold=False, align='l', bullet=False, sb=0, spc=None, line_spc=110):
    return para_xml([(t, size, color, bold, spc)], align=align, bullet=bullet,
                    space_before=sb, line_spc=line_spc)


# ─────────────────────────────────────────────────────────────
# 页面骨架：标题区 + 页码 + 底部装饰
# ─────────────────────────────────────────────────────────────
def chrome(gen, kicker, title, page_no, total):
    shapes = []
    shapes.append(sp_rect(gen, 0, 0, SLIDE_W, 685800, fill=PANEL))                     # 顶栏
    shapes.append(sp_rect(gen, 0, 685800, SLIDE_W, 19050, fill=CYAN))                  # 顶栏下亮线
    shapes.append(sp_rect(gen, 457200, 152400, 76200, 381000, fill=CYAN))              # 标题左侧竖条
    shapes.append(sp_text(gen, 609600, 127000, SLIDE_W - 1219200, 228600, [
        P(kicker, 11, CYAN, bold=True, spc=300)]))
    shapes.append(sp_text(gen, 609600, 320040, SLIDE_W - 1219200, 320040, [
        P(title, 21, WHITE, bold=True)]))
    shapes.append(sp_text(gen, SLIDE_W - 1219200, 190500, 762000, 304800, [
        P(f'{page_no:02d} / {total:02d}', 10.5, DIM, align='r')]))
    shapes.append(sp_rect(gen, 0, SLIDE_H - 114300, SLIDE_W, 114300, fill=PANEL))      # 底栏
    shapes.append(sp_text(gen, 457200, SLIDE_H - 104775, 6000000, 95250, [
        P('BOEING 787-10 FLIGHT DECK SIMULATOR', 8, DIM, spc=260)]))
    shapes.append(sp_text(gen, SLIDE_W - 2459200, SLIDE_H - 104775, 2000000, 95250, [
        P('参赛作品 · 答辩演示', 8, DIM, align='r')]))
    return shapes


def card(gen, x, y, w, h, title, title_color, body_paras):
    shapes = [sp_rect(gen, x, y, w, h, fill=PANEL, line=LINE, round_=True),
              sp_rect(gen, x, y, w, 57150, fill=title_color)]
    tp = [P(title, 13, title_color, bold=True, sb=0)]
    shapes.append(sp_text(gen, x + 228600, y + 114300, w - 457200, 285750, tp))
    shapes.append(sp_text(gen, x + 228600, y + 485775, w - 457200, h - 600075, body_paras))
    return shapes


# ─────────────────────────────────────────────────────────────
# 各页内容
# ─────────────────────────────────────────────────────────────
def slide_cover(gen):
    shapes = [sp_pic(gen, 'rId2', 0, 0, SLIDE_W, SLIDE_H, name='CoverBg'),
              sp_rect(gen, 0, 0, SLIDE_W, SLIDE_H, fill='04070C', alpha=58),
              sp_rect(gen, 0, SLIDE_H - 2743200, SLIDE_W, 2743200, fill='04070C', alpha=72)]
    shapes.append(sp_text(gen, 914400, 1600200, 10363200, 457200, [
        P('BOEING · DREAMLINER · 参赛作品', 13, CYAN, bold=True, spc=380, align='c')]))
    shapes.append(sp_text(gen, 914400, 2011680, 10363200, 1371600, [
        P('波音 787-10 飞行模拟器', 54, WHITE, bold=True, align='c')]))
    shapes.append(sp_text(gen, 914400, 3423920, 10363200, 381000, [
        P('FULL FLIGHT DECK SIMULATOR IN YOUR BROWSER', 15, MUTED, spc=420, align='c')]))
    shapes.append(sp_rect(gen, 5486400, 4000000, 1219200, 19050, fill=CYAN))
    shapes.append(sp_text(gen, 1371600, 4343400, 9456800, 381000, [
        P('完整驾驶舱  ◆  交互式起飞教程  ◆  9 条真实航线  ◆  AI 自动恢复  ◆  全自动降落', 13, WHITE, align='c')]))
    shapes.append(sp_text(gen, 1371600, SLIDE_H - 914400, 9456800, 381000, [
        P('答辩人：XXX      用时约 4–5 分钟', 12, DIM, align='c')]))
    return shapes


def slide_overview(gen):
    shapes = chrome(gen, 'PROJECT OVERVIEW', '作品概述：把 787 驾驶舱搬进浏览器', 2, 11)
    shapes.append(sp_rect(gen, 457200, 1009650, 11277600, 771525, fill=PANEL2, line=LINE, round_=True))
    shapes.append(sp_text(gen, 685800, 1123950, 10820400, 552450, [
        P('一句话：用 Web 技术还原波音 787-10 的核心飞行体验 —— 从起飞教学、航线选择，到自动驾驶巡航与 AI 全自动降落。', 14, WHITE, line_spc=115)]))
    cw, ch, gap = 2700338, 1771650, 190500
    y0 = 2028825
    cards = [
        ('🛫 完整驾驶舱', CYAN, 'MCP 自动驾驶面板、油门 / 襟翼 / 起落架 / 反推、Canvas PFD 姿态仪、LCD 状态行、引擎监控，全键盘可达。'),
        ('🎓 起飞教程', GREEN, '787-10 参数卡片 + 自播放起飞动画，教程步骤与动画进度同步高亮，新手 30 秒学会起飞。'),
        ('🌏 真实航线', AMBER, '9 条国内外航线（京沪、沪港、中澳跨洋…），5 家真实航司 LOGO 与航班号，附带航向指示。'),
        ('🤖 AI 副驾', RED, '分级警报 + AI AUTO RECOVER 一键改出；AUTO-LAND 全自动降落：下滑→接地→反推→停稳。'),
    ]
    for i, (t, c, b) in enumerate(cards):
        x = 457200 + i * (cw + gap)
        shapes += card(gen, x, y0, cw, ch, t, c,
                       [P(b, 11, MUTED, sb=4, line_spc=118)])
    shapes.append(sp_rect(gen, 457200, 4114800, 11277600, 1143000, fill=PANEL, line=LINE, round_=True))
    shapes.append(sp_text(gen, 685800, 4229100, 5400000, 228600, [P('技术栈', 13, CYAN, bold=True)]))
    shapes.append(sp_text(gen, 685800, 4514850, 10820400, 628650, [
        P('Next.js 16（App Router） · React 19 · TypeScript 严格模式（零 any） · Tailwind CSS 4', 12, WHITE, sb=2),
        P('Canvas 2D 主飞行显示器 · Web Audio 分级告警音 · 帧率无关的经验公式物理模型 · 生产模式部署', 12, WHITE, sb=4)]))
    return shapes


def slide_flow(gen):
    shapes = chrome(gen, 'WORKFLOW', '作品操作流程总览：四段式体验', 3, 11)
    steps = [
        ('① 主题封面', '波音 LOGO + 真机起飞背景\n点击进入 / 回车进入', CYAN),
        ('② 起飞教程', '787-10 参数卡片\n自播放起飞动画\n步骤同步高亮', GREEN),
        ('③ 航线选择', '9 条真实航线\n航司 LOGO + 航班号\n固定航向指示', AMBER),
        ('④ 驾驶舱飞行', '起飞 → AP 巡航\n降落模式 AUTO-LAND\n接地反推停稳', RED),
    ]
    bw, bh = 2476500, 2286000
    y0 = 1905000
    total_w = bw * 4 + 476250 * 3
    x0 = (SLIDE_W - total_w) // 2
    for i, (t, b, c) in enumerate(steps):
        x = x0 + i * (bw + 476250)
        shapes.append(sp_rect(gen, x, y0, bw, bh, fill=PANEL, line=c, round_=True))
        shapes.append(sp_rect(gen, x, y0, bw, 76200, fill=c))
        shapes.append(sp_text(gen, x + 152400, y0 + 190500, bw - 304800, 381000, [P(t, 16, c, bold=True, align='c')]))
        paras = [P(line, 11.5, MUTED, align='c', sb=5) for line in b.split('\n')]
        shapes.append(sp_text(gen, x + 152400, y0 + 685800, bw - 304800, bh - 838200, paras))
        if i < 3:
            shapes.append(sp_text(gen, x + bw, y0 + bh // 2 - 238125, 476250, 476250,
                                  [P('▶', 20, CYAN, bold=True, align='c')]))
    shapes.append(sp_rect(gen, 2286000, 4800600, 7620000, 581025, fill=PANEL2, line=LINE, round_=True))
    shapes.append(sp_text(gen, 2286000, 4895850, 7620000, 400050, [
        P('单页应用内无缝流转 · 支持昼夜双主题 · 全屏演示模式 · 随时空格暂停', 12.5, WHITE, align='c')]))
    return shapes


def slide_mcp(gen):
    shapes = chrome(gen, 'COCKPIT CONTROLS · 1/3', '飞机按键（一）：MCP 自动驾驶面板', 4, 11)
    shapes.append(sp_rect(gen, 457200, 1009650, 5486400, 1314450, fill=PANEL2, line=AMBER, round_=True))
    shapes.append(sp_text(gen, 685800, 1114425, 4914900, 1095375, [
        P('⚠ AP 接通条件（否则提示 AP INHIBIT）', 12.5, AMBER, bold=True),
        P('双发运转 · 空速 > 150 kt · 高度 > 1000 ft', 12.5, WHITE, sb=6),
        P('接通瞬间自动捕获当前 IAS / ALT / HDG 为保持目标', 11.5, MUTED, sb=6)]))
    y0 = 2619375
    knobs = [
        ('HEADING 航向旋钮', '±5° / 步 · 0–359°\n目标坡度 = 航向误差 × 0.8（限 ±25°）', CYAN),
        ('IAS 空速旋钮', '±5 kt / 步\n速度误差反解油门开度（自动油门）', GREEN),
        ('ALT 高度旋钮', '±500 ft / 步\n高度误差 + 垂直速度阻尼 → 俯仰目标', AMBER),
    ]
    bw = 3562350
    for i, (t, b, c) in enumerate(knobs):
        x = 457200 + i * (bw + 190500)
        shapes += card(gen, x, y0, bw, 1514475, t, c,
                       [P(line, 11, MUTED, sb=4) for line in b.split('\n')])
    shapes.append(sp_rect(gen, 457200, 4381500, 11277600, 876300, fill=PANEL, line=LINE, round_=True))
    shapes.append(sp_text(gen, 685800, 4486275, 5400000, 228600, [P('FMA 飞行模式通告器（实时三栏）', 12.5, CYAN, bold=True)]))
    shapes.append(sp_text(gen, 685800, 4778375, 10820400, 381000, [
        P('THRUST：IDLE / THRUST / TOGA / REVERSE      VERTICAL：SPEED / ALT HOLD / LAND SEQ      LATERAL：HDG / HDG HOLD', 12, WHITE)]))
    return shapes


def slide_controls(gen):
    shapes = chrome(gen, 'COCKPIT CONTROLS · 2/3', '飞机按键（二）：飞行操纵与键盘快捷键', 5, 11)
    # 左：键盘表
    lx, ty, tw = 457200, 1009650, 5486400
    shapes.append(sp_rect(gen, lx, ty, tw, 4248150, fill=PANEL, line=LINE, round_=True))
    shapes.append(sp_text(gen, lx + 228600, ty + 152400, tw - 457200, 285750, [P('⌨ 键盘快捷键（全键盘可达）', 13, CYAN, bold=True)]))
    keys = [
        ('1 / 2', '发动机 1 / 2 点火开关'),
        ('W / S', '油门 ±2%'),
        ('[  /  ]', '襟翼收 / 放（0–30° 多档）'),
        ('↑ / ↓', '俯仰（拉杆 / 推杆）'),
        ('← / →', '副翼坡度 ±2°'),
        ('P', '接通 / 断开自动驾驶'),
        ('R', '地面反推'),
        ('Space', '暂停 / 继续'),
    ]
    row_h = 438150
    for i, (k, v) in enumerate(keys):
        ry = ty + 533400 + i * row_h
        if i % 2 == 0:
            shapes.append(sp_rect(gen, lx + 114300, ry, tw - 228600, row_h, fill=PANEL2, alpha=55))
        shapes.append(sp_rect(gen, lx + 228600, ry + 76200, 1028700, 285750, fill='0A121C', line=LINE, round_=True))
        shapes.append(sp_text(gen, lx + 228600, ry + 104775, 1028700, 228600, [P(k, 11.5, CYAN, bold=True, align='c')]))
        shapes.append(sp_text(gen, lx + 1384300, ry + 104775, tw - 1600200, 228600, [P(v, 11.5, WHITE)]))
    # 右：面板控件
    rx = 6172200
    rw = SLIDE_W - rx - 457200
    shapes.append(sp_rect(gen, rx, ty, rw, 4248150, fill=PANEL, line=LINE, round_=True))
    shapes.append(sp_text(gen, rx + 228600, ty + 152400, rw - 457200, 285750, [P('🎛 面板控件', 13, GREEN, bold=True)]))
    items = [
        ('THRUST 油门滑杆', '0–100% 拖拽 / 键盘微调，引擎 N1 一阶惯性响应'),
        ('FLAPS 襟翼档位', '0–30° 多档：增升 0.7/°，同时增加阻力'),
        ('GEAR 起落架', '空中收轮减阻；低于 80 ft 自动增阻'),
        ('REV 反推', '条件互锁：地面 + 轮放下 + 双发运转 + AP 断开'),
        ('ENGINE 1 / 2 开关', 'N1 / EGT / 燃油流量实时联动'),
        ('主题 / 暂停 / 重置 / 全屏', '顶栏系统按键，昼夜双主题一键切换'),
    ]
    paras = []
    for t, b in items:
        paras.append(P('▪ ' + t, 12, WHITE, bold=True, sb=8))
        paras.append(P('   ' + b, 11, MUTED, sb=2))
    shapes.append(sp_text(gen, rx + 228600, ty + 533400, rw - 457200, 3600450, paras))
    return shapes


def slide_display(gen):
    shapes = chrome(gen, 'COCKPIT CONTROLS · 3/3', '飞机按键（三）：显示、警报与 AI 恢复按钮', 6, 11)
    cw, ch = 3562350, 2009775
    y0 = 1009650
    cards = [
        ('🖥 Canvas PFD 主飞行显示器', CYAN,
         [P('姿态仪 + 空速带 / 高度带', 11.5, WHITE, sb=4, bullet=True),
          P('Vr 抬轮速度提示游标', 11.5, WHITE, sb=4, bullet=True),
          P('60 fps 实时渲染，帧率无关', 11.5, WHITE, sb=4, bullet=True)]),
        ('📟 LCD 电子状态行', GREEN,
         [P('IAS / ALT / HDG / FUEL 常显', 11.5, WHITE, sb=4, bullet=True),
          P('航线上高度 > 40 ft 显示 RTE 航向', 11.5, WHITE, sb=4, bullet=True),
          P('等宽数字防界面抖动', 11.5, WHITE, sb=4, bullet=True)]),
        ('🔊 分级警报条', AMBER,
         [P('危险红 / 注意琥珀 两级配色', 11.5, WHITE, sb=4, bullet=True),
          P('Web Audio 分级音色提醒', 11.5, WHITE, sb=4, bullet=True),
          P('粘滞 1.2 s 防抖，仅新增警报响铃', 11.5, WHITE, sb=4, bullet=True)]),
    ]
    for i, (t, c, paras) in enumerate(cards):
        shapes += card(gen, 457200 + i * (cw + 190500), y0, cw, ch, t, c, paras)
    # AUTO RECOVER 大卡片
    y1 = 3209925
    shapes.append(sp_rect(gen, 457200, y1, 11277600, 2047875, fill=PANEL, line=RED, round_=True))
    shapes.append(sp_rect(gen, 457200, y1, 76200, 2047875, fill=RED))
    shapes.append(sp_text(gen, 762000, y1 + 152400, 10820400, 342900,
                          [P('🤖 AUTO RECOVER —— 一键 AI 自动改出按钮', 15, RED, bold=True)]))
    shapes.append(sp_text(gen, 762000, y1 + 571500, 5353050, 1371600, [
        P('警报条上的每条险情都附带：', 12, WHITE, sb=2),
        P('AI 一句话恢复建议（自然语言）', 11.5, MUTED, sb=5, bullet=True),
        P('可直接执行的恢复动作 key', 11.5, MUTED, sb=5, bullet=True),
        P('点击按钮即由 AI 副驾接管执行改出', 11.5, MUTED, sb=5, bullet=True)]))
    shapes.append(sp_text(gen, 6286500, y1 + 571500, 5143500, 1371600, [
        P('示例：', 12, WHITE, sb=2),
        P('STALL →「自动推杆低头并加满油门换取速度」', 11.5, MUTED, sb=5),
        P('GPWS SINK RATE →「自动拉杆改出，建立正上升率」', 11.5, MUTED, sb=5),
        P('ALL ENGINES OFF →「按 1 和 2 重新点火」', 11.5, MUTED, sb=5)]))
    return shapes


def slide_ap_law(gen):
    shapes = chrome(gen, 'AI AVIONICS · 1/3', '航电 AI（一）：自动驾驶三通道控制律', 7, 11)
    cw = 3562350
    y0 = 1009650
    laws = [
        ('速度环 → 自动油门', CYAN, [
            '估算阻力 = 0.018·V + 0.00032·V² + 襟翼/起落架修正',
            '期望加速度 = 限幅(速度误差 × 0.16)',
            '反解油门开度 0–100%，一阶惯性平滑',
        ]),
        ('高度环 → 俯仰', GREEN, [
            '俯仰目标 = 高度误差×0.0015 − 垂直速度阻尼',
            '限幅 −3° ~ +8°，防过激操纵',
            '降落模式 <500 ft 改恒定 −2.5° 下滑角',
        ]),
        ('航向环 → 坡度', AMBER, [
            '坡度目标 = 航向误差 × 0.8',
            '限幅 ±25°（标准率转弯）',
            '最短弧转向，自动处理 360° 环绕',
        ]),
    ]
    for i, (t, c, lines) in enumerate(laws):
        paras = [P(line, 11, MUTED, sb=6, bullet=True, line_spc=115) for line in lines]
        shapes += card(gen, 457200 + i * (cw + 190500), y0, cw, 2238375, t, c, paras)
    y1 = 3465525
    shapes.append(sp_rect(gen, 457200, y1, 11277600, 1791975, fill=PANEL2, line=CYAN, round_=True))
    shapes.append(sp_text(gen, 685800, y1 + 152400, 10820400, 304800,
                          [P('🛡 内置飞行包线保护（AI 强制介入）', 13.5, CYAN, bold=True)]))
    shapes.append(sp_text(gen, 685800, y1 + 552450, 5353050, 1114425, [
        P('失速保护：IAS < 失速限制 → 强制推头 −2°', 12, WHITE, sb=4, bullet=True),
        P('超速保护：IAS > 340 kt → 自动拉杆 +3°', 12, WHITE, sb=5, bullet=True)]))
    shapes.append(sp_text(gen, 6286500, y1 + 552450, 5143500, 1114425, [
        P('全程帧率无关：一阶惯性滤波，任意刷新率表现一致', 12, WHITE, sb=4, bullet=True),
        P('Vr 速度门槛：未达抬轮速度拉杆无效，防止提前离地', 12, WHITE, sb=5, bullet=True)]))
    return shapes


def slide_recover(gen):
    shapes = chrome(gen, 'AI AVIONICS · 2/3', '航电 AI（二）：AI AUTO RECOVER 自动改出', 8, 11)
    rows = [
        ('STALL 失速', '危险', '推杆低头 + 满油门换速度', 'pushNose', RED),
        ('GPWS · SINK RATE 近地大下降率', '危险', '拉杆改出，建立正上升率', 'pullUp', RED),
        ('ALL ENGINES OFF 双发熄火', '危险', '自动重新点火 1 / 2 号发动机', 'restartEng', RED),
        ('OVERSPEED 超速', '注意', '收油门 + 轻拉杆减至 330 kt 以下', 'idlePower', AMBER),
        ('ALTITUDE DEVIATION 高度偏离', '注意', '接管俯仰回切目标高度', 'levelOff', AMBER),
        ('ENG FAILURE 单发失效', '注意', '建议：机翼水平、油门 ≤80%、尽快落地', '—（人工建议）', AMBER),
    ]
    ty = 1009650
    tw = 11277600
    shapes.append(sp_rect(gen, 457200, ty, tw, 3600450, fill=PANEL, line=LINE, round_=True))
    heads = [('警报', 1371600), ('级别', 685800), ('AI 恢复程序', 5943600), ('执行动作', 2514600)]
    hy = ty + 190500
    shapes.append(sp_rect(gen, 571500, hy, tw - 228600, 381000, fill=PANEL2))
    x = 685800
    for h, w in heads:
        shapes.append(sp_text(gen, x, hy + 76200, w, 228600, [P(h, 11.5, CYAN, bold=True)]))
        x += w + 114300
    row_h = 476250
    for i, (a, lv, rec, act, c) in enumerate(rows):
        ry = hy + 381000 + i * row_h
        if i % 2 == 0:
            shapes.append(sp_rect(gen, 571500, ry, tw - 228600, row_h, fill=PANEL2, alpha=45))
        x = 685800
        vals = [(a, WHITE, True), (lv, c, True), (rec, MUTED, False), (act, GREEN, False)]
        for (v, vc, vb), (_, w) in zip(vals, heads):
            shapes.append(sp_text(gen, x, ry + 123825, w, 228600, [P(v, 11, vc, bold=vb)]))
            x += w + 114300
    shapes.append(sp_rect(gen, 457200, 4800600, 11277600, 457200, fill=PANEL2, line=LINE, round_=True))
    shapes.append(sp_text(gen, 685800, 4886325, 10820400, 285750, [
        P('判定引擎按优先级轮询 · 粘滞 1.2 s 移除防抖 · 仅新增警报触发提示音，避免警报轰炸', 12, WHITE, align='c')]))
    return shapes


def slide_autoland(gen):
    shapes = chrome(gen, 'AI AVIONICS · 3/3', '航电 AI（三）：AUTO-LAND 全自动降落', 9, 11)
    steps = [
        ('巡航中开启', '降落模式开关\nAP 全程接管', CYAN),
        ('截获下滑道', '<500 ft 切换\n恒定 −2.5° 下滑角', GREEN),
        ('自动接地', '主轮触地\nTOUCHDOWN 横幅', AMBER),
        ('自动断 AP', '接地后断开自驾\n油门收光', RED),
        ('自动反推停稳', 'REV 减速至停\nFLIGHT COMPLETE', 'FFFFFF'),
    ]
    bw, bh = 2019300, 1638300
    y0 = 1181100
    total_w = bw * 5 + 285750 * 4
    x0 = (SLIDE_W - total_w) // 2
    for i, (t, b, c) in enumerate(steps):
        x = x0 + i * (bw + 285750)
        cc = c if c != 'FFFFFF' else WHITE
        shapes.append(sp_rect(gen, x, y0, bw, bh, fill=PANEL, line=cc, round_=True))
        shapes.append(sp_text(gen, x + 114300, y0 + 133350, bw - 228600, 533400, [P(t, 13, cc, bold=True, align='c')]))
        paras = [P(line, 10.5, MUTED, align='c', sb=4) for line in b.split('\n')]
        shapes.append(sp_text(gen, x + 114300, y0 + 695325, bw - 228600, 819150, paras))
        if i < 4:
            shapes.append(sp_text(gen, x + bw, y0 + bh // 2 - 190500, 285750, 381000,
                                  [P('▸', 16, CYAN, align='c')]))
    y1 = 3209925
    shapes.append(sp_rect(gen, 457200, y1, 5486400, 2047875, fill=PANEL, line=LINE, round_=True))
    shapes.append(sp_text(gen, 685800, y1 + 152400, 4914900, 304800, [P('为什么 <500 ft 改用恒定下滑角？', 13, AMBER, bold=True)]))
    shapes.append(sp_text(gen, 685800, y1 + 533400, 4914900, 1400175, [
        P('按高度误差闭环时，近地会出现「悬停平衡」—— 下降率趋近于零却迟迟不接地。', 11.5, MUTED, sb=4, line_spc=118),
        P('改为恒定 −2.5° 下滑角后，航空器以确定姿态稳定触地，这是真实自动着陆的简化思路。', 11.5, MUTED, sb=6, line_spc=118)]))
    shapes.append(sp_rect(gen, 6172200, y1, 5562600, 2047875, fill=PANEL, line=LINE, round_=True))
    shapes.append(sp_text(gen, 6400800, y1 + 152400, 5105400, 304800, [P('全程无需任何人工输入', 13, GREEN, bold=True)]))
    shapes.append(sp_text(gen, 6400800, y1 + 533400, 5105400, 1400175, [
        P('开启开关后：油门、俯仰、接地、断 AP、反推全部由 AI 完成', 11.5, WHITE, sb=4, bullet=True),
        P('反推互锁自动校验：地面 + 轮放下 + 双发 + AP 断开', 11.5, WHITE, sb=6, bullet=True),
        P('停稳后弹出 FLIGHT COMPLETE 完成横幅', 11.5, WHITE, sb=6, bullet=True)]))
    return shapes


def slide_demo(gen):
    shapes = chrome(gen, 'LIVE DEMO', '操作流程演示：一次完整飞行（约 90 秒）', 10, 11)
    steps = [
        ('1', '进入', '封面点击「进入驾驶舱」，观看参数卡片与起飞教程动画'),
        ('2', '选航线', '选择京沪快线 CA1501（航向 101°），进入驾驶舱'),
        ('3', '起飞', '按 1、2 点火 → 襟翼 10° → 满油门 → 达 Vr 抬轮离地'),
        ('4', '巡航', '按 P 接通 AP，MCP 旋钮设定目标高度 / 航向，观察自动油门'),
        ('5', '降落', '开启降落模式，AUTO-LAND 自动下滑、接地、反推、停稳'),
    ]
    y0 = 1066800
    for i, (n, t, d) in enumerate(steps):
        y = y0 + i * 819150
        shapes.append(sp_rect(gen, 457200, y, 11277600, 704850, fill=PANEL, line=LINE, round_=True))
        shapes.append(sp_rect(gen, 685800, y + 104775, 495300, 495300, fill=CYAN, round_=True))
        shapes.append(sp_text(gen, 685800, y + 152400, 495300, 400050, [P(n, 18, BG, bold=True, align='c')]))
        shapes.append(sp_text(gen, 1371600, y + 104775, 1714500, 495300, [P(t, 16, WHITE, bold=True)]))
        shapes.append(sp_text(gen, 3200400, y + 190500, 8229600, 342900, [P(d, 12.5, MUTED)]))
        shapes.append(sp_rect(gen, 2851150, y + 133350, 9525, 438150, fill=LINE))
    return shapes


def slide_end(gen):
    shapes = [sp_rect(gen, 0, 0, SLIDE_W, SLIDE_H, fill=BG)]
    shapes.append(sp_rect(gen, 0, 2286000, SLIDE_W, 19050, fill=CYAN))
    shapes.append(sp_text(gen, 914400, 1181100, 10363200, 1143000, [
        P('总结与亮点', 40, WHITE, bold=True, align='c')]))
    shapes.append(sp_text(gen, 914400, 2514600, 10363200, 381000, [
        P('KEY TAKEAWAYS', 13, CYAN, spc=420, align='c')]))
    cards = [
        ('工程', 'React 组件化驾驶舱 · TS 严格模式 · 生产模式部署', CYAN),
        ('体验', '真实航司航线 · 分级告警音 · 昼夜主题 · 全键盘可达', GREEN),
        ('创新', 'AI 副驾：险情识别 → 自然语言建议 → 一键自动改出', AMBER),
    ]
    cw = 3562350
    for i, (t, b, c) in enumerate(cards):
        x = 457200 + i * (cw + 190500)
        shapes += card(gen, x, 3200400, cw, 1371600, t, c, [P(b, 11, MUTED, sb=4, line_spc=118)])
    shapes.append(sp_text(gen, 914400, 5114925, 10363200, 571500, [
        P('谢谢观看 · 欢迎体验 · 恳请评委批评指正', 20, WHITE, bold=True, align='c')]))
    shapes.append(sp_text(gen, 914400, 5829300, 10363200, 381000, [
        P('BOEING 787-10 FLIGHT DECK SIMULATOR · 娱乐演示，非训练设备', 10.5, DIM, spc=200, align='c')]))
    return shapes


# ─────────────────────────────────────────────────────────────
# 演讲者备注（含建议用时，总计约 4.5 分钟）
# ─────────────────────────────────────────────────────────────
NOTES = [
    '【约 25 秒】各位评委好。我的参赛作品是「波音 787-10 飞行模拟器」——一个运行在浏览器里的完整驾驶舱。它包含四大能力：完整驾驶舱、交互式起飞教程、9 条真实航线，以及我重点设计的 AI 副驾：自动改出 + 全自动降落。接下来用 4 分多钟，从按键、航电 AI 和操作流程三方面介绍。',
    '【约 25 秒】一句话概括：用 Web 技术还原 787-10 的核心飞行体验——从教学、选航线，到自动驾驶巡航和 AI 全自动降落。技术上采用 Next.js 16 + React 19 + TypeScript 严格模式，PFD 用 Canvas 渲染，告警音用 Web Audio，物理是帧率无关的经验公式模型，在任何刷新率下手感一致。',
    '【约 20 秒】整体操作流程是四段式：封面 → 起飞教程 → 航线选择 → 驾驶舱。教程动画会边播边高亮当前步骤，新用户 30 秒能学会起飞；航线页提供 9 条真实航线和真实航司 LOGO。接下来先看驾驶舱里的按键。',
    '【约 30 秒】第一类按键是 MCP 自动驾驶面板。为了贴近真实，AP 接通有条件：双发运转、空速大于 150 节、高度高于 1000 英尺，否则提示 AP INHIBIT。接通瞬间会自动捕获当前速度、高度、航向作为保持目标。三个旋钮分别调航向、空速、高度，步进和真机一致。下方 FMA 三栏实时显示推力、垂直、横向模式。',
    '【约 30 秒】第二类是飞行操纵：油门滑杆、襟翼档位、起落架和反推。反推做了和真机一样的互锁逻辑：必须在地面、轮放下、双发运转且 AP 断开才能开启。全部功能都映射了键盘快捷键——1、2 点火，W/S 油门，括号襟翼，方向键姿态，P 自动驾驶，R 反推，空格暂停，演示时完全不用碰鼠标。',
    '【约 30 秒】第三类是显示与警报。左侧 Canvas PFD 实时渲染姿态和速度高度带；顶部 LCD 状态行常显五项关键参数。警报条分危险红和注意琥珀两级，配不同音色，并做了 1.2 秒粘滞防抖、只对新警报响铃。重点是警报右侧的 AUTO RECOVER 按钮：每条险情都附 AI 恢复建议，点一下由 AI 副驾直接改出。',
    '【约 35 秒】航电 AI 第一部分：自动驾驶三通道控制律。速度环先估算阻力，再由速度误差算期望加速度，反解油门开度；高度环用高度误差加垂直速度阻尼生成俯仰目标；航向环把航向误差乘 0.8 转成 ±25° 以内的坡度，实现标准率转弯。同时内置包线保护：失速强制推头、超速自动拉杆，还有 Vr 抬轮速度门槛，没到速度拉杆无效。',
    '【约 35 秒】第二部分是 AI AUTO RECOVER 自动改出，这是作品的创新点。系统持续判定六类险情：失速、近地大下降率、双发熄火、超速、高度偏离、单发失效。每类都给出自然语言恢复程序，前五类还能一键自动执行，比如失速时自动推杆加满油门、双发熄火时自动重新点火。判定引擎做了优先级和防抖，避免警报轰炸。',
    '【约 35 秒】第三部分是 AUTO-LAND 全自动降落。巡航时开启降落模式后全程无需人工输入：低于 500 英尺自动切换恒定 -2.5° 下滑角——这是为了解决高度闭环在近地「悬停不落地」的问题；随后自动接地、自动断 AP、油门收光、反推减速到停稳，弹出完成横幅。整条链路把真实自动着陆做了可演示的简化。',
    '【现场演示约 60–90 秒】下面实际操作一遍：进入封面、看教程动画、选京沪快线 CA1501；点火、襟翼 10 度、满油门，到 Vr 抬轮；爬升后按 P 接通自动驾驶，用 MCP 旋钮改目标高度；巡航中开启降落模式，大家可以看到 AUTO-LAND 自动下滑、接地、反推直到停稳。（若时间紧，可只演示起飞和接通 AP。）',
    '【约 20 秒】总结一下：工程上组件化、类型安全、生产部署；体验上有真实航线、告警音、昼夜主题、全键盘可达；创新点是把 AI 副驾引入告警系统，做到识别、建议、一键改出的闭环。我的演示到此结束，谢谢各位评委，欢迎体验并批评指正。',
]

SLIDE_BUILDERS = [
    slide_cover, slide_overview, slide_flow, slide_mcp, slide_controls,
    slide_display, slide_ap_law, slide_recover, slide_autoland, slide_demo, slide_end,
]


# ─────────────────────────────────────────────────────────────
# OOXML 骨架
# ─────────────────────────────────────────────────────────────
def slide_xml(shapes):
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + BG + '"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'
        '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        + ''.join(shapes) +
        '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'
    )


def notes_xml(text):
    paras = ''.join(
        f'<a:p><a:r><a:rPr lang="zh-CN" dirty="0"><a:latin typeface="{FONT}"/><a:ea typeface="{FONT}"/></a:rPr>'
        f'<a:t>{esc(line)}</a:t></a:r></a:p>' for line in text.split('\n'))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
        '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        '<p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr/>'
        '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="zh-CN"/></a:p></p:txBody></p:sp>'
        '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        '<p:nvPr><p:ph type="body" idx="3"/></p:nvPr></p:nvSpPr><p:spPr/>'
        f'<p:txBody><a:bodyPr/><a:lstStyle/>{paras}</p:txBody></p:sp>'
        '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>'
    )


CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Default Extension="jpg" ContentType="image/jpeg"/>'
    '<Default Extension="png" ContentType="image/png"/>'
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
    '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>'
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    + ''.join(
        f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        f'<Override PartName="/ppt/notesSlides/notesSlide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>'
        for i in range(1, len(SLIDE_BUILDERS) + 1))
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
      '</Types>'
)

ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
    '</Relationships>'
)

PRESENTATION_XML = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">'
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
    '<p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst>'
    '<p:sldIdLst>'
    + ''.join(f'<p:sldId id="{255 + i}" r:id="rId{i + 2}"/>' for i in range(1, len(SLIDE_BUILDERS) + 1))
    + '</p:sldIdLst>'
      f'<p:sldSz cx="{SLIDE_W}" cy="{SLIDE_H}"/><p:notesSz cx="{6858000}" cy="{9144000}"/>'
      '<p:defaultTextStyle><a:defPPr><a:defRPr lang="zh-CN"/></a:defPPr></p:defaultTextStyle>'
      '</p:presentation>'
)

PRESENTATION_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="notesMasters/notesMaster1.xml"/>'
    + ''.join(
        f'<Relationship Id="rId{i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>'
        for i in range(1, len(SLIDE_BUILDERS) + 1))
    + '<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>'
      '</Relationships>'
)

SLIDE_MASTER = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + BG + '"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'
    '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
    '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" '
    'accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
    '<p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="3200"/></a:lvl1pPr></p:titleStyle>'
    '<p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle>'
    '<p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles>'
    '</p:sldMaster>'
)

SLIDE_MASTER_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
    '</Relationships>'
)

SLIDE_LAYOUT = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">'
    '<p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>'
    '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'
)

SLIDE_LAYOUT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
    '</Relationships>'
)

NOTES_MASTER = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/>'
    '<a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
    '<p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr>'
    '<p:spPr><a:xfrm><a:off x="1524000" y="685800"/><a:ext cx="3810000" cy="2143125"/></a:xfrm>'
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
    '<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>'
    '<a:p><a:endParaRPr lang="zh-CN"/></a:p></p:txBody></p:sp>'
    '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
    '<p:nvPr><p:ph type="body" idx="3"/></p:nvPr></p:nvSpPr>'
    '<p:spPr><a:xfrm><a:off x="685800" y="3200400"/><a:ext cx="5486400" cy="4114800"/></a:xfrm>'
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
    '<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>'
    '<a:p><a:endParaRPr lang="zh-CN"/></a:p></p:txBody></p:sp>'
    '</p:spTree></p:cSld>'
    '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" '
    'accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    '<p:notesStyle><a:lvl1pPr><a:defRPr sz="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:notesStyle>'
    '</p:notesMaster>'
)

NOTES_MASTER_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
    '</Relationships>'
)

THEME = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="787 Deck">'
    '<a:themeElements>'
    '<a:clrScheme name="787">'
    '<a:dk1><a:srgbClr val="04070C"/></a:dk1><a:lt1><a:srgbClr val="EAF4FB"/></a:lt1>'
    '<a:dk2><a:srgbClr val="0B1520"/></a:dk2><a:lt2><a:srgbClr val="9FB9C9"/></a:lt2>'
    '<a:accent1><a:srgbClr val="50D7FF"/></a:accent1><a:accent2><a:srgbClr val="4EC98A"/></a:accent2>'
    '<a:accent3><a:srgbClr val="F0B429"/></a:accent3><a:accent4><a:srgbClr val="FF6B6B"/></a:accent4>'
    '<a:accent5><a:srgbClr val="8193A8"/></a:accent5><a:accent6><a:srgbClr val="1D3245"/></a:accent6>'
    '<a:hlink><a:srgbClr val="50D7FF"/></a:hlink><a:folHlink><a:srgbClr val="8193A8"/></a:folHlink>'
    '</a:clrScheme>'
    '<a:fontScheme name="787">'
    '<a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface=""/></a:majorFont>'
    '<a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface=""/></a:minorFont>'
    '</a:fontScheme>'
    '<a:fmtScheme name="787">'
    '<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
    '<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
    '<a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
    '<a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
    '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle>'
    '<a:effectStyle><a:effectLst/></a:effectStyle>'
    '<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
    '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
    '</a:fmtScheme>'
    '</a:themeElements></a:theme>'
)

CORE_PROPS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
    'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    '<dc:title>波音 787-10 飞行模拟器 · 参赛演讲</dc:title>'
    '<dc:creator>787 Flight Deck Simulator</dc:creator>'
    '<cp:lastModifiedBy>787 Flight Deck Simulator</cp:lastModifiedBy>'
    '<dcterms:created xsi:type="dcterms:W3CDTF">2026-11-24T00:00:00Z</dcterms:created>'
    '<dcterms:modified xsi:type="dcterms:W3CDTF">2026-11-24T00:00:00Z</dcterms:modified>'
    '</cp:coreProperties>'
)

APP_PROPS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
    'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
    '<Application>787 Deck Generator</Application>'
    f'<Slides>{len(SLIDE_BUILDERS)}</Slides><Notes>{len(SLIDE_BUILDERS)}</Notes>'
    '</Properties>'
)


def slide_rels(idx):
    rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>']
    if idx == 1:
        rels.append('<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.jpg"/>')
        rels.append('<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/>')
    else:
        rels.append(f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{idx}.xml"/>')
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + ''.join(rels) + '</Relationships>')


def notes_rels(idx):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide{idx}.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
            '</Relationships>')


def main():
    if os.path.exists(OUT):
        os.remove(OUT)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CONTENT_TYPES)
        z.writestr('_rels/.rels', ROOT_RELS)
        z.writestr('docProps/core.xml', CORE_PROPS)
        z.writestr('docProps/app.xml', APP_PROPS)
        z.writestr('ppt/presentation.xml', PRESENTATION_XML)
        z.writestr('ppt/_rels/presentation.xml.rels', PRESENTATION_RELS)
        z.writestr('ppt/slideMasters/slideMaster1.xml', SLIDE_MASTER)
        z.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels', SLIDE_MASTER_RELS)
        z.writestr('ppt/slideLayouts/slideLayout1.xml', SLIDE_LAYOUT)
        z.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels', SLIDE_LAYOUT_RELS)
        z.writestr('ppt/notesMasters/notesMaster1.xml', NOTES_MASTER)
        z.writestr('ppt/notesMasters/_rels/notesMaster1.xml.rels', NOTES_MASTER_RELS)
        z.writestr('ppt/theme/theme1.xml', THEME)
        for i, builder in enumerate(SLIDE_BUILDERS, start=1):
            gen = IdGen()
            z.writestr(f'ppt/slides/slide{i}.xml', slide_xml(builder(gen)))
            z.writestr(f'ppt/slides/_rels/slide{i}.xml.rels', slide_rels(i))
            z.writestr(f'ppt/notesSlides/notesSlide{i}.xml', notes_xml(NOTES[i - 1]))
            z.writestr(f'ppt/notesSlides/_rels/notesSlide{i}.xml.rels', notes_rels(i))
        if os.path.exists(COVER_IMG):
            with open(COVER_IMG, 'rb') as f:
                z.writestr('ppt/media/image1.jpg', f.read())
        else:
            print('!! 封面图缺失，跳过嵌入：', COVER_IMG)
    print('OK ->', OUT, f'{os.path.getsize(OUT) / 1024:.0f} KB')


if __name__ == '__main__':
    main()
