#!/usr/bin/env python3
"""Build the If Life Partner explainer sheets (en + fi) as static HTML.

Run: python3 docs/visuals/build.py   (then export.sh for the PNG files)
"""
import math
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = ["overview", "subsystems", "stakeholders", "benefits"]

T = {
    "en": {
        "lang": "en",
        "inks": ["If", "Customers", "Partners"],
        "nav": ["Overview", "Subsystems", "Stakeholders", "Benefits"],
        "titles": {
            "overview": "If Life Partner",
            "subsystems": "How the service works",
            "stakeholders": "Who takes part",
            "benefits": "What each party gains",
        },
        "answers": {
            "subsystems": "One loop runs for each risk in the home: find it, fix it, prove it, reward it, keep it fixed.",
            "stakeholders": "Customers, If and partners each hold one part of the service. The service lives where all three overlap.",
            "benefits": "Prevention pays three ways. Every party gives something and gets something back.",
        },
        "marks": ["Verified source", "Unverified"],
        "sub": {
            "legend": [
                ("Intake", "Address lookup, photos, a questionnaire and documents describe the home. Unverified."),
                ("Risk engine", "An AI model turns the inputs into a short risk list. Each risk says why, and what fixing it is worth."),
                ("Partner bidding", "Vetted partners bid for the job (kilpailutus). The customer chooses."),
                ("Verification", "The partner confirms the finished job. An expert inspects when that is not enough."),
                ("Mitigation score", "One number. A breakdown shows what raised it and by how much."),
                ("Rewards", "Lower premium and deductible, partner discounts, tier benefits, checkups."),
                ("Maintenance and alerts", "The list updates itself from part age, partner reports, weather, season and new laws."),
                ("Identity and delegation", "Strong electronic ID. Family members act with delegated authorisation."),
                ("If data console", "Underwriters, claims handlers, sales and product teams, partner managers."),
            ],
            "disc": {2: ["Risk", "engine"], 3: ["Partner", "bidding"], 4: ["Verifi-", "cation"],
                     5: ["Mitigation", "score"], 6: ["Rewards"], 7: ["Mainte-", "nance"]},
            "intake": ["Address", "Photos", "Questionnaire", "Documents"],
            "verify": ["partner", "expert"],
            "score_sub": "one number",
            "console": ["If data console", "underwriting · claims", "sales · partners"],
            "identity": "Identity and delegation: strong electronic ID; family acts with permission",
        },
        "stk": {
            "groups": [
                ("spruce", "Customers", [
                    ("Home owners", "core users, including older people"),
                    ("Family members", "act for them with delegated authorisation"),
                    ("People without an If plan", "get a general risk list"),
                    ("If plan holders", "get a tailored list, checkups and benefits"),
                    ("Later", "car owners, people in other life events"),
                ]),
                ("blue", "If", [
                    ("Staff", "underwriters, claims handlers, sales and product teams, partner managers"),
                ]),
                ("sun", "Partners", [
                    ("Vetted tradespeople", "electricians, plumbers, insulation and others"),
                    ("Expert inspectors", "when a partner's confirmation is not enough"),
                ]),
                ("ring", "Outside sources", [
                    ("Data", "public building and address data, weather and forecasts, laws and regulations, strong electronic ID"),
                    ("Not in the service", "banks: only if If decides later, with customer consent"),
                ]),
            ],
            "circles": ["Customers", "If", "Partners"],
            "pairs": [["Score and", "rewards"], ["Jobs and", "bidding"], ["Vetting and", "listing"]],
            "centre": ["If Life", "Partner"],
            "outside": ["Building and address data", "Weather and forecasts", "Laws and regulations", "Strong electronic ID"],
            "banks": ["Banks: later, If's decision,", "customer consent"],
        },
        "ben": {
            "rows": ["Money", "Risk", "Effort", "Trust", "Growth", "They give"],
            "cols": [
                [["Fewer claim payouts", "Listing fees from partners"],
                 ["Fewer accidents, so fewer claims", "Verified risk data for pricing"],
                 ["Claims arrive with prepared documents and mitigation history"],
                 ["Part of daily life, not only at claim time"],
                 ["New customers through the free general risk list", "Customers stay to keep their score", "Insight for product recommendations"],
                 ["Free checkups and the service itself"]],
                [["Lower premium and deductible", "Partner discounts", "Free or discounted checkups"],
                 ["Fewer accidents at home", "Knows each risk and what fixing it is worth"],
                 ["The maintenance list keeps itself current", "Reminders and weather alerts", "Free competitive bidding"],
                 ["Only vetted partners", "Proof comes from outside sources, so the score is fair"],
                 ["Benefits grow as the score grows", "Family can help through delegated access"],
                 ["Time to fix risks", "Facts about their home"]],
                [["Paid jobs from If customers"],
                 ["A clear job scope from the risk analysis"],
                 ["Customers come to them, so less sales work"],
                 ["“Certified by If” status"],
                 ["Access to If's customer base"],
                 ["A listing fee", "Discounts for customers"]],
            ],
        },
    },
    "fi": {
        "lang": "fi",
        "inks": ["If", "Asiakkaat", "Kumppanit"],
        "nav": ["Yleiskuva", "Osajärjestelmät", "Sidosryhmät", "Hyödyt"],
        "titles": {
            "overview": "If Life Partner",
            "subsystems": "Näin palvelu toimii",
            "stakeholders": "Ketkä ovat mukana",
            "benefits": "Mitä kukin hyötyy",
        },
        "answers": {
            "subsystems": "Jokaiselle kodin riskille kulkee sama kierros: löydä, korjaa, todenna, palkitse ja pidä kunnossa.",
            "stakeholders": "Asiakkaat, If ja kumppanit hoitavat kukin osan palvelusta. Palvelu syntyy siellä, missä kaikki kolme kohtaavat.",
            "benefits": "Ennaltaehkäisy hyödyttää kolmea osapuolta. Jokainen antaa jotain ja saa jotain takaisin.",
        },
        "marks": ["Todennettu lähde", "Todentamaton"],
        "sub": {
            "legend": [
                ("Lähtötiedot", "Osoitehaku, valokuvat, kysely ja asiakirjat kuvaavat kodin. Todentamattomia."),
                ("Riskimoottori", "Tekoälymalli tekee tiedoista lyhyen riskilistan. Jokainen riski kertoo syyn ja korjaamisen hyödyn."),
                ("Kumppanikilpailutus", "Hyväksytyt kumppanit tarjoavat työtä. Asiakas valitsee."),
                ("Todentaminen", "Kumppani vahvistaa valmiin työn. Asiantuntija tarkastaa, jos se ei riitä."),
                ("Turvapisteet", "Yksi luku. Erittely näyttää, mikä nosti sitä ja kuinka paljon."),
                ("Edut", "Pienempi vakuutusmaksu ja omavastuu, kumppanialennukset, tasoedut, tarkastukset."),
                ("Huoltolista ja muistutukset", "Lista päivittyy itse osien iän, kumppanien raporttien, sään, vuodenajan ja uusien lakien mukaan."),
                ("Tunnistus ja valtuutus", "Vahva sähköinen tunnistus. Läheiset asioivat valtuutuksella."),
                ("Ifin datanäkymä", "Riskinarvioijat, korvauskäsittelijät, myynti- ja tuotetiimit, kumppanivastaavat."),
            ],
            "disc": {2: ["Riski-", "moottori"], 3: ["Kilpai-", "lutus"], 4: ["Todenta-", "minen"],
                     5: ["Turva-", "pisteet"], 6: ["Edut"], 7: ["Huolto-", "lista"]},
            "intake": ["Osoite", "Valokuvat", "Kysely", "Asiakirjat"],
            "verify": ["kumppani", "asiantuntija"],
            "score_sub": "yksi luku",
            "console": ["Ifin datanäkymä", "riskinarviointi · korvaukset", "myynti · kumppanit"],
            "identity": "Tunnistus ja valtuutus: vahva sähköinen tunnistus; läheinen asioi valtuutuksella",
        },
        "stk": {
            "groups": [
                ("spruce", "Asiakkaat", [
                    ("Kodinomistajat", "ydinkäyttäjät, myös ikääntyneet"),
                    ("Läheiset", "asioivat heidän puolestaan valtuutuksella"),
                    ("Ilman If-vakuutusta", "saavat yleisen riskilistan"),
                    ("If-asiakkaat", "saavat räätälöidyn listan, tarkastukset ja edut"),
                    ("Myöhemmin", "autonomistajat ja muut elämänmuutokset"),
                ]),
                ("blue", "If", [
                    ("Henkilöstö", "riskinarvioijat, korvauskäsittelijät, myynti- ja tuotetiimit, kumppanivastaavat"),
                ]),
                ("sun", "Kumppanit", [
                    ("Hyväksytyt ammattilaiset", "sähkö, putket, eristys ja muut"),
                    ("Asiantuntijatarkastajat", "kun kumppanin vahvistus ei riitä"),
                ]),
                ("ring", "Ulkoiset lähteet", [
                    ("Tiedot", "julkiset rakennus- ja osoitetiedot, sää ja ennusteet, lait ja määräykset, vahva sähköinen tunnistus"),
                    ("Ei palvelussa", "pankit: vain jos If myöhemmin päättää, asiakkaan suostumuksella"),
                ]),
            ],
            "circles": ["Asiakkaat", "If", "Kumppanit"],
            "pairs": [["Pisteet", "ja edut"], ["Työt ja", "kilpailutus"], ["Hyväksyntä", "ja listaus"]],
            "centre": ["If Life", "Partner"],
            "outside": ["Rakennus- ja osoitetiedot", "Sää ja ennusteet", "Lait ja määräykset", "Vahva tunnistus"],
            "banks": ["Pankit: myöhemmin, Ifin päätös,", "asiakkaan suostumus"],
        },
        "ben": {
            "rows": ["Raha", "Riski", "Vaiva", "Luottamus", "Kasvu", "Antaa"],
            "cols": [
                [["Vähemmän korvausmaksuja", "Kumppanien listausmaksut"],
                 ["Vähemmän vahinkoja ja korvauksia", "Todennettua riskidataa hinnoitteluun"],
                 ["Korvaushakemuksen mukana valmiit asiakirjat ja korjaushistoria"],
                 ["Osa arkea, ei vain vahingon sattuessa"],
                 ["Uusia asiakkaita ilmaisen yleisen riskilistan kautta", "Asiakkaat pysyvät pitääkseen pisteensä", "Tietoa tuotesuosituksiin"],
                 ["Ilmaiset tarkastukset ja itse palvelu"]],
                [["Pienempi vakuutusmaksu ja omavastuu", "Kumppanialennukset", "Ilmaiset tai alennetut tarkastukset"],
                 ["Vähemmän vahinkoja kotona", "Tietää jokaisen riskin ja korjaamisen hyödyn"],
                 ["Huoltolista pysyy itsestään ajan tasalla", "Muistutukset ja säävaroitukset", "Ilmainen kilpailutus"],
                 ["Vain hyväksyttyjä kumppaneita", "Todisteet tulevat ulkopuolisista lähteistä, joten pisteet ovat reiluja"],
                 ["Edut kasvavat pisteiden mukana", "Läheiset voivat auttaa valtuutuksella"],
                 ["Aikaa riskien korjaamiseen", "Tietoja kodistaan"]],
                [["Maksettuja töitä If-asiakkailta"],
                 ["Selkeä työn kuvaus riskianalyysista"],
                 ["Asiakkaat tulevat heidän luokseen, joten myyntityötä on vähemmän"],
                 ["”If-sertifioitu”-asema"],
                 ["Pääsy Ifin asiakaskuntaan"],
                 ["Listausmaksu", "Alennuksia asiakkaille"]],
            ],
        },
    },
}

OV = {
    "en": {
        "tagline": "Fix the risks in your home before they become damage, and pay less.",
        "steps": [
            ("Find", ["If's AI finds the", "risks in your home."]),
            ("Fix", ["A vetted partner", "fixes them."]),
            ("Prove", ["The partner confirms", "the work to If."]),
            ("Save", ["Your score rises", "and your price falls."]),
        ],
        "loop": "Then the app keeps your home in shape.",
        "gains": [
            ("blue", "If", "Fewer claims, and customers who stay."),
            ("spruce", "Customers", "A safer home and a lower price."),
            ("sun", "Partners", "More jobs, and the “Certified by If” label."),
        ],
    },
    "fi": {
        "tagline": "Korjaa kotisi riskit ennen kuin niistä tulee vahinkoja, ja maksa vähemmän.",
        "steps": [
            ("Löydä", ["Ifin tekoäly löytää", "kotisi riskit."]),
            ("Korjaa", ["Hyväksytty kumppani", "korjaa ne."]),
            ("Todenna", ["Kumppani vahvistaa", "työn Ifille."]),
            ("Säästä", ["Pisteesi nousevat", "ja hintasi laskee."]),
        ],
        "loop": "Sen jälkeen sovellus pitää kotisi kunnossa.",
        "gains": [
            ("blue", "If", "Vähemmän korvauksia ja asiakkaita, jotka pysyvät."),
            ("spruce", "Asiakkaat", "Turvallisempi koti ja halvempi hinta."),
            ("sun", "Kumppanit", "Lisää töitä ja ”If-sertifioitu”-merkki."),
        ],
    },
}

INK = {"blue": "var(--blue)", "spruce": "var(--spruce)", "sun": "var(--sun)"}


def e(s):
    return escape(s, quote=True)


def text_lines(x, y, lines, cls="lbl", fill_cls="", lh=22, anchor="middle"):
    """SVG text block centred vertically on y."""
    top = y - (len(lines) - 1) * lh / 2
    out = []
    for i, ln in enumerate(lines):
        out.append(f'<text x="{x:.1f}" y="{top + i * lh:.1f}" text-anchor="{anchor}" '
                   f'dominant-baseline="middle" class="{cls} {fill_cls}">{e(ln)}</text>')
    return "".join(out)


def num_badge(x, y, n, light=True):
    stroke = "#fff" if light else "var(--ink)"
    fill = "#fff" if light else "var(--ink)"
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="12" fill="none" stroke="{stroke}" stroke-width="1.5"/>'
            f'<text x="{x:.1f}" y="{y + 0.5:.1f}" text-anchor="middle" dominant-baseline="middle" '
            f'style="fill:{fill};font-size:12px;font-weight:700">{n}</text>')


def disc(x, y, r, inks, n, label, sub=None):
    """One node: a flat disc, or two overprinted discs when two parties share it."""
    out = []
    # knock the paper out under the inks so the loop line does not print through
    for dx in ((0,) if len(inks) == 1 else (-r * 0.24, r * 0.24)):
        out.append(f'<circle cx="{x + dx:.1f}" cy="{y:.1f}" r="{r}" fill="var(--paper)"/>')
    if len(inks) == 1:
        out.append(f'<circle class="ink" cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{INK[inks[0]]}"/>')
    else:
        d = r * 0.24
        out.append(f'<circle class="ink" cx="{x - d:.1f}" cy="{y:.1f}" r="{r}" fill="{INK[inks[0]]}"/>')
        out.append(f'<circle class="ink" cx="{x + d:.1f}" cy="{y:.1f}" r="{r}" fill="{INK[inks[1]]}"/>')
    light = inks != ["sun"]
    fill_cls = "on-ink" if light else ""
    out.append(num_badge(x, y - r * 0.5, n, light))
    out.append(text_lines(x, y + 8, label, "lbl", fill_cls, 22))
    if sub:
        out.append(text_lines(x, y + 8 + len(label) * 11 + 14, [sub], "sub", fill_cls))
    return "".join(out)


def arrowhead(x, y, dx, dy, size=9):
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    px, py = -uy, ux
    tip = (x + ux * size, y + uy * size)
    a = (x - ux * size * 0.6 + px * size * 0.75, y - uy * size * 0.6 + py * size * 0.75)
    b = (x - ux * size * 0.6 - px * size * 0.75, y - uy * size * 0.6 - py * size * 0.75)
    return (f'<path d="M{tip[0]:.1f},{tip[1]:.1f} L{a[0]:.1f},{a[1]:.1f} L{b[0]:.1f},{b[1]:.1f} Z" '
            f'fill="var(--ink)"/>')


def figure_subsystems(t):
    s = t["sub"]
    cx, cy, R, r = 520, 372, 250, 80
    # loop order, clockwise from the top: risk engine, bidding, verification, rewards, maintenance
    nodes = [(2, -90, ["blue"]), (3, -18, ["sun"]), (4, 54, ["sun", "blue"]),
             (6, 126, ["blue", "spruce"]), (7, 198, ["spruce"])]
    pos = {n: (cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))) for n, a, _ in nodes}
    out = [f'<svg viewBox="0 0 1000 800" role="img" aria-labelledby="fig-t">'
           f'<title id="fig-t">{e(t["titles"]["subsystems"])}</title>']
    # the loop
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="var(--ink)" stroke-width="1.5"/>')
    for a in (-54, 18, 90, 162, 234):
        th = math.radians(a)
        out.append(arrowhead(cx + R * math.cos(th), cy + R * math.sin(th), -math.sin(th), math.cos(th)))
    # spokes: verification feeds the score, the score feeds rewards
    def spoke(p, q, r1, r2):
        dx, dy = q[0] - p[0], q[1] - p[1]
        L = math.hypot(dx, dy)
        ux, uy = dx / L, dy / L
        a = (p[0] + ux * r1, p[1] + uy * r1)
        b = (q[0] - ux * (r2 + 10), q[1] - uy * (r2 + 10))
        return (f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" '
                f'stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>'
                + arrowhead(b[0], b[1], ux, uy, 8))
    out.append(spoke(pos[4], (cx, cy), r + 22, 106))
    out.append(spoke((cx, cy), pos[6], 106, r + 22))
    # centre: the score, kept by If, owned by the customer
    out.append(disc(cx, cy, 104, ["blue", "spruce"], 5, s["disc"][5], s["score_sub"]))
    for n, _, inks in nodes:
        x, y = pos[n]
        out.append(disc(x, y, r, inks, n, s["disc"][n]))
    # verification marks
    vx, vy = pos[4]
    out.append(f'<circle cx="{vx - 62:.1f}" cy="{vy + r + 30:.1f}" r="6" fill="var(--ink)"/>'
               f'<text x="{vx - 50:.1f}" y="{vy + r + 31:.1f}" dominant-baseline="middle" class="sub">{e(s["verify"][0])}</text>'
               f'<circle cx="{vx - 62:.1f}" cy="{vy + r + 54:.1f}" r="6" fill="var(--ink)"/>'
               f'<text x="{vx - 50:.1f}" y="{vy + r + 55:.1f}" dominant-baseline="middle" class="sub">{e(s["verify"][1])}</text>')
    # 1 intake, outside the loop, feeding the risk engine
    ix, iy = 40, 56
    out.append(num_badge(ix + 12, iy, 1, light=False))
    out.append(f'<text x="{ix + 34}" y="{iy + 1}" dominant-baseline="middle" class="lbl">{e(t["sub"]["legend"][0][0])}</text>')
    for i, item in enumerate(s["intake"]):
        y = iy + 40 + i * 28
        out.append(f'<circle cx="{ix + 12}" cy="{y}" r="6" fill="none" stroke="var(--ink)" stroke-width="1.5"/>'
                   f'<text x="{ix + 28}" y="{y + 1}" dominant-baseline="middle" class="sub">{e(item)}</text>')
    rx, ry = pos[2]
    out.append(f'<path d="M{ix + 160},{iy + 82} C{ix + 260},{iy + 82} {rx - 160},{ry} {rx - r - 16},{ry}" '
               f'fill="none" stroke="var(--ink)" stroke-width="1.5"/>' + arrowhead(rx - r - 16, ry, 1, 0))
    # 9 If data console, fed by verification and the score
    kx, ky, kw, kh = 790, 600, 200, 112
    out.append(f'<rect class="ink" x="{kx}" y="{ky}" width="{kw}" height="{kh}" fill="var(--blue)"/>')
    out.append(num_badge(kx + 24, ky + 26, 9, True))
    out.append(f'<text x="{kx + 44}" y="{ky + 27}" dominant-baseline="middle" class="lbl on-ink" style="font-size:18px">{e(s["console"][0])}</text>')
    out.append(f'<text x="{kx + 18}" y="{ky + 64}" class="sub on-ink">{e(s["console"][1])}</text>')
    out.append(f'<text x="{kx + 18}" y="{ky + 88}" class="sub on-ink">{e(s["console"][2])}</text>')
    out.append(f'<path d="M{vx + r + 4:.1f},{vy:.1f} C{kx - 30},{vy} {kx - 40},{ky + kh / 2} {kx - 12},{ky + kh / 2}" '
               f'fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round"/>'
               + arrowhead(kx - 12, ky + kh / 2, 1, 0, 8))
    # 8 identity band under everything
    by = 742
    out.append(f'<rect x="0" y="{by}" width="1000" height="48" fill="var(--paper-deep)"/>')
    out.append(f'<rect class="ink" x="0" y="{by}" width="10" height="48" fill="var(--spruce)"/>')
    out.append(num_badge(36, by + 24, 8, light=False))
    out.append(f'<text x="58" y="{by + 25}" dominant-baseline="middle" class="sub">{e(s["identity"])}</text>')
    out.append("</svg>")
    return "".join(out)


def figure_stakeholders(t):
    k = t["stk"]
    C, I, P = (500, 300), (395, 482), (605, 482)
    R = 200
    out = [f'<svg viewBox="0 0 1000 800" role="img" aria-labelledby="fig-t">'
           f'<title id="fig-t">{e(t["titles"]["stakeholders"])}</title>']
    # outside sources: the ring the three parties draw from
    oc, orr = (500, 418), 368
    out.append(f'<circle cx="{oc[0]}" cy="{oc[1]}" r="{orr}" fill="none" stroke="var(--ink)" stroke-width="1.2"/>')
    for (a, lbl, anchor, dx) in zip((-145, -35, 35, 145), k["outside"], ("end", "start", "start", "end"), (-16, 16, 16, -16)):
        th = math.radians(a)
        x, y = oc[0] + orr * math.cos(th), oc[1] + orr * math.sin(th)
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="var(--ink)"/>'
                   f'<text x="{x + dx:.1f}" y="{y + 1:.1f}" text-anchor="{anchor}" dominant-baseline="middle" class="sub" '
                   f'style="font-weight:600">{e(lbl)}</text>')
    # the three parties, overprinted
    for (x, y), ink in ((C, "spruce"), (I, "blue"), (P, "sun")):
        out.append(f'<circle class="ink" cx="{x}" cy="{y}" r="{R}" fill="{INK[ink]}"/>')
    out.append(text_lines(C[0], C[1] - 104, [k["circles"][0]], "lbl on-ink", "", 0).replace('class="lbl on-ink "', 'class="lbl on-ink" style="font-size:28px"'))
    out.append(text_lines(I[0] - 92, I[1] + 70, [k["circles"][1]], "lbl on-ink", "", 0).replace('class="lbl on-ink "', 'class="lbl on-ink" style="font-size:28px"'))
    out.append(text_lines(P[0] + 92, P[1] + 70, [k["circles"][2]], "lbl", "", 0).replace('class="lbl "', 'class="lbl" style="font-size:28px"'))
    # what each pair shares
    out.append(text_lines(402, 368, k["pairs"][0], "sub on-ink", "", 19))
    out.append(text_lines(598, 368, k["pairs"][1], "sub on-ink", "", 19))
    out.append(text_lines(500, 548, k["pairs"][2], "sub on-ink", "", 19))
    # the service, where all three overlap
    out.append(text_lines(500, 428, k["centre"], "lbl on-ink", "", 22))
    # banks: outside the service, dashed
    bx, by = 878, 760
    out.append(f'<circle cx="{bx - 170}" cy="{by}" r="7" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 3"/>')
    out.append(f'<text x="{bx - 156}" y="{by - 9}" class="sub soft">{e(k["banks"][0])}</text>')
    out.append(f'<text x="{bx - 156}" y="{by + 11}" class="sub soft">{e(k["banks"][1])}</text>')
    out.append("</svg>")
    return "".join(out)


def head(t, page):
    inks = "".join(f'<span><i class="swatch {c}"></i>{e(n)}</span>'
                   for c, n in zip(("blue", "spruce", "sun"), t["inks"]))
    return (f'<header class="head"><span class="service">If Life Partner</span>'
            f'<span class="inks" aria-hidden="true">{inks}</span></header>')


def foot(t, page):
    other = "fi" if t["lang"] == "en" else "en"
    nav = "".join(
        f'<a href="{p}.html"{" aria-current=\"page\"" if p == page else ""}>{e(n)}</a>'
        for p, n in zip(PAGES, t["nav"]))
    lang = (f'<a href="{page}.html" aria-current="true" lang="{t["lang"]}">{t["lang"].upper()}</a>'
            f'<a href="../{other}/{page}.html" lang="{other}">{other.upper()}</a>')
    if t["lang"] == "fi":
        lang = (f'<a href="../en/{page}.html" lang="en">EN</a>'
                f'<a href="{page}.html" aria-current="true" lang="fi">FI</a>')
    else:
        lang = (f'<a href="{page}.html" aria-current="true" lang="en">EN</a>'
                f'<a href="../fi/{page}.html" lang="fi">FI</a>')
    return f'<footer class="foot"><nav aria-label="Sheets">{nav}</nav><span class="lang">{lang}</span></footer>'


def doc(t, page, body):
    return (f'<!doctype html><html lang="{t["lang"]}"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{e(t["titles"][page])} · If Life Partner</title>'
            f'<link rel="stylesheet" href="../visuals.css"></head><body>'
            f'{head(t, page)}{body}{foot(t, page)}</body></html>\n')


def figure_overview(t):
    o = OV[t["lang"]]
    xs, y, r = (160, 480, 820, 1170), 170, 105
    off = r * 0.18
    inks = (["blue"], ["sun"], ["sun", "blue"], ["blue", "spruce"])
    out = [f'<svg viewBox="0 0 1330 500" role="img" aria-labelledby="fig-t">'
           f'<title id="fig-t">{e(o["tagline"])}</title>']
    for i, (x, (word, cap), ink) in enumerate(zip(xs, o["steps"], inks), 1):
        light = ink != ["sun"]
        for dx in ((0,) if len(ink) == 1 else (-off, off)):
            out.append(f'<circle cx="{x + dx:.1f}" cy="{y}" r="{r}" fill="var(--paper)"/>')
        if len(ink) == 1:
            out.append(f'<circle class="ink" cx="{x}" cy="{y}" r="{r}" fill="{INK[ink[0]]}"/>')
        else:
            out.append(f'<circle class="ink" cx="{x - off:.1f}" cy="{y}" r="{r}" fill="{INK[ink[0]]}"/>')
            out.append(f'<circle class="ink" cx="{x + off:.1f}" cy="{y}" r="{r}" fill="{INK[ink[1]]}"/>')
        out.append(num_badge(x, y - 52, i, light))
        out.append(f'<text x="{x}" y="{y + 12}" text-anchor="middle" dominant-baseline="middle" '
                   f'class="lbl {"on-ink" if light else ""}" style="font-size:38px;letter-spacing:-0.02em">{e(word)}</text>')
        out.append(text_lines(x, y + r + 58, cap, "sub", "", 28).replace('class="sub "', 'class="sub" style="font-size:22px"'))
        if i < 4:
            a = x + r + 18 + (off if i >= 3 else 0)
            b = xs[i] - r - 24 - (off if i + 1 >= 3 else 0)
            out.append(f'<line x1="{a:.1f}" y1="{y}" x2="{b:.1f}" y2="{y}" stroke="var(--ink)" stroke-width="2"/>'
                       + arrowhead(b, y, 1, 0, 11))
    # the return: after saving, the maintenance list keeps the home fixed
    ly = 425
    out.append(f'<path d="M{xs[3]},{ly - 30} L{xs[3]},{ly} L{xs[0]},{ly} L{xs[0]},{ly - 24}" fill="none" '
               f'stroke="var(--ink)" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/>'
               + arrowhead(xs[0], ly - 24, 0, -1, 11))
    out.append(f'<rect x="{(xs[0] + xs[3]) / 2 - 330}" y="{ly - 20}" width="660" height="40" fill="var(--paper)"/>')
    out.append(f'<text x="{(xs[0] + xs[3]) / 2}" y="{ly + 1}" text-anchor="middle" dominant-baseline="middle" '
               f'class="lbl" style="font-size:22px">{e(o["loop"])}</text>')
    out.append("</svg>")
    return "".join(out)


def page_overview(t):
    o = OV[t["lang"]]
    gains = "".join(
        f'<li><i class="swatch {c}"></i><b>{e(n)}</b><span>{e(g)}</span></li>' for c, n, g in o["gains"])
    body = (f'<main class="sheet wide overview"><div class="ov-top"><h1>{e(t["titles"]["overview"])}</h1>'
            f'<p class="answer">{e(o["tagline"])}</p></div>'
            f'<figure>{figure_overview(t)}</figure><ul class="gains">{gains}</ul></main>')
    return doc(t, "overview", body)


def page_subsystems(t):
    items = "".join(
        f'<li><span class="n">{i}</span><span><b>{e(name)}.</b> {e(desc)}</span></li>'
        for i, (name, desc) in enumerate(t["sub"]["legend"], 1))
    marks = (f'<div class="marks"><span><i class="mark on"></i>{e(t["marks"][0])}</span>'
             f'<span><i class="mark off"></i>{e(t["marks"][1])}</span></div>')
    body = (f'<main class="sheet"><div><h1>{e(t["titles"]["subsystems"])}</h1>'
            f'<p class="answer">{e(t["answers"]["subsystems"])}</p><ol class="legend">{items}</ol>{marks}</div>'
            f'<figure>{figure_subsystems(t)}</figure></main>')
    return doc(t, "subsystems", body)


def page_stakeholders(t):
    groups = []
    for ink, name, rows in t["stk"]["groups"]:
        sw = (f'<i class="swatch {ink}"></i>' if ink != "ring"
              else '<i class="mark off" style="width:13px;height:13px"></i>')
        lis = "".join(f'<li><span></span><span><b>{e(a)}:</b> {e(b)}</span></li>' for a, b in rows)
        groups.append(f'<h2 class="group">{sw}{e(name)}</h2><ul class="legend">{lis}</ul>')
    body = (f'<main class="sheet"><div><h1>{e(t["titles"]["stakeholders"])}</h1>'
            f'<p class="answer">{e(t["answers"]["stakeholders"])}</p>{"".join(groups)}</div>'
            f'<figure>{figure_stakeholders(t)}</figure></main>')
    return doc(t, "stakeholders", body)


def page_benefits(t):
    b = t["ben"]
    heads = "".join(f'<th scope="col"><div class="band {c}">{e(n)}</div></th>'
                    for c, n in zip(("blue", "spruce", "sun"), t["inks"]))
    rows = []
    for ri, rname in enumerate(b["rows"]):
        cells = "".join(
            f'<td data-party="{e(t["inks"][ci])}"><ul>{"".join(f"<li>{e(x)}</li>" for x in b["cols"][ci][ri])}</ul></td>'
            for ci in range(3))
        cls = ' class="give"' if ri == len(b["rows"]) - 1 else ""
        rows.append(f'<tr{cls}><th scope="row">{e(rname)}</th>{cells}</tr>')
    body = (f'<main class="sheet wide"><div class="benefits-top"><h1>{e(t["titles"]["benefits"])}</h1>'
            f'<p class="answer">{e(t["answers"]["benefits"])}</p></div>'
            f'<table class="matrix"><thead><tr><th scope="col"><span class="sr"></span></th>{heads}</tr></thead>'
            f'<tbody>{"".join(rows)}</tbody></table></main>')
    return doc(t, "benefits", body)


if __name__ == "__main__":
    for lang, t in T.items():
        d = ROOT / lang
        d.mkdir(exist_ok=True)
        (d / "overview.html").write_text(page_overview(t), encoding="utf-8")
        (d / "subsystems.html").write_text(page_subsystems(t), encoding="utf-8")
        (d / "stakeholders.html").write_text(page_stakeholders(t), encoding="utf-8")
        (d / "benefits.html").write_text(page_benefits(t), encoding="utf-8")
    print("built", sorted(str(p.relative_to(ROOT)) for p in ROOT.glob("*/*.html")))
