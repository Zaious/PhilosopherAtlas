# Philosopher Atlas · 哲學家地圖

An interactive map of philosophers across history and cultures. **235 philosophers**, each pinned at their birthplace on a **de-sovereignized** basemap — colour is intellectual tradition, size is cross-source consensus (**k**), and scrubbing the timeline reveals **that year's historical polity borders**.

> We don't define "what a philosopher is" — we judge by a reproducible procedure: the union of several authoritative sources' own membership lists forms the pool; the more sources that list someone (the higher their **k**), the more central they are. If you disagree, argue with the procedure and the sources, not personal taste.

🔗 Live: *(add your GitHub Pages URL here once enabled)* · 📦 Repo: [github.com/Zaious/PhilosopherAtlas](https://github.com/Zaious/PhilosopherAtlas) · 👤 [linkedin.com/in/zaious](https://www.linkedin.com/in/zaious/)

---

## Features

- **De-sovereignized basemap** — no modern national borders; only when you pick a year does that **year's** historical polity border appear (scrub through and watch empires rise and fall). Coordinates are neutral anchors — no "belongs to country X" is ever stored.
- **Federal canon × k-value** — SEP, IEP, Feng Youlan, Lao Sze-kwang, Routledge, and Wikidata each contribute their own membership list; the pool is their union. **k** = how many independent sources list a person; **k ≥ 2** to appear on the map.
- **Semantic clustering** — overlapping pins cluster and colour by dominant tradition; hover to preview a name; click to spiderfy same-city clusters apart.
- **Person cards** — click a pin for a biography, "why included" (which sources list them), what polity the place belonged to that year, notable works, and a career-path trail across the map.
- **Honesty guardrails** — blank beats wrong (uncertain data is left empty, never guessed); the Anglophone source bias is shown openly in the legend; machine-derived data is labelled with its provenance and approximation level.
- **Bilingual** — full English/Traditional Chinese UI and biography toggle (top-right language button).

## Inclusion rules (who appears)

A figure must satisfy **all** of the following:

1. **Deceased for at least 20 years** (death year ≤ current year − 20, rolling); the living are excluded.
2. **Enters the pool**: tagged a philosopher on Wikidata (P106), or listed by any authoritative canon source.
3. **k ≥ 2**: listed by at least two independent sources.
4. **Identity resolvable**: maps to a unique Wikidata entity.

Full methodology, k-value derivation, and honesty guardrails are documented inside the app itself (nav → Method). Data schema: [`schema/philosopher.schema.json`](schema/philosopher.schema.json).

## Project structure

```
philosopher-atlas/
├─ web/            frontend (static, no build step; D3 v7 self-hosted, no runtime CDN)
│  ├─ index.html  app.js  style.css
│  ├─ vendor/     d3, topojson (bundled)
│  └─ basemap/    Natural Earth coastlines/rivers/lakes + historical border snapshots
├─ data/
│  ├─ philosophers/{QID}.json   one file per person (single source of truth)
│  └─ atlas_index.json          lightweight index consumed by the frontend
├─ schema/philosopher.schema.json
└─ scripts/validate_philosophers.ps1   CI validator
```

## Run locally

Needs an HTTP server (`fetch` won't work over `file://`). Serve from the **project root** so `web/` can load `../data/` relatively:

```bash
cd philosopher-atlas
python -m http.server 8000
# open http://localhost:8000/web/
```

## Deploy (GitHub Pages)

Deploy straight from the repo root — `web/index.html` loads data via `../data/` relative paths, and `data/` is a sibling of `web/`.

## Contributing

**Data is files; disputes are pull requests.** Corrections and additions are welcome — there's one principle: **argue about the procedure and the sources, not personal taste.**

- Each philosopher = one JSON file (`data/philosophers/{QID}.json`), validated against the schema.
- To add someone, contest an inclusion, or supply a translated name / coordinate / polity / work → edit the JSON and open a pull request.
- Think someone is missing? Point to which authoritative source lists them.
- All Chinese text must be **Traditional**; `k`, `centrality`, coordinates, and polities are program-derived — **don't hand-edit them**.

CI validates the schema, detects simplified characters, and checks that k/centrality are self-consistent (`scripts/validate_philosophers.ps1`).

_(Planned: a form-based back end so people without Git can contribute too — see "Roadmap" in the app.)_

## Data & licensing

**Code** (`web/`, `scripts/`): [MIT](LICENSE) — free to use and modify, but the copyright notice must be retained.

**Data** (`data/`): **CC BY-SA 4.0** — because it incorporates CC BY-SA sources (Wikipedia biography extracts, historical border data), it is shared under the same terms with attribution required.

Per-source breakdown:

| Source | Used for | License |
|---|---|---|
| Wikidata | population pool, birth/death, coordinates, multilingual names, works (P800) | CC0 |
| Wikipedia (zh + en) | biography extracts (`bio` / `bio_en`) | CC BY-SA 4.0 |
| Natural Earth | coastlines, rivers, lakes | Public Domain |
| aourednik/historical-basemaps | era-synced historical polity borders (approximate, snapshot granularity) | CC BY-SA |
| SEP, IEP | canon membership lists (inclusion evidence) | cited |
| Feng Youlan's *A Short History of Chinese Philosophy*, Lao Sze-kwang's *New History of Chinese Philosophy*, the Routledge Philosophers series | canon membership lists (cited as evidence, not reproduced) | cited |

Historical borders and some polity sequences are machine-derived and snapshot-approximate, not authoritative rulings; contested modern-year borders are the dataset's own depiction.

## Maintainer

**Zaious** — [GitHub](https://github.com/Zaious/PhilosopherAtlas) · [LinkedIn](https://www.linkedin.com/in/zaious/)

---

<details>
<summary>繁體中文說明</summary>

## 這是什麼

古今中外哲學家的互動地圖。**235 位**哲學家標於一張**去主權化**的底圖上：顏色代表思想傳統、大小代表跨來源共識（**k** 值）；拉動時間軸，看該年在世者與**當年的歷史政體邊界**。

> 不定義「哲學家是什麼」，改用可複現的程序判定：讓多個權威來源的成員清單聯集生出母體，被越多來源收錄（k 值越高）越是核心。要爭，就對準程序與來源。

## 特色

- **去主權化底圖**：無現代國界；選定年份時才顯示**那一年**的歷史政體邊界。座標是中性錨點，不存「今屬國家」。
- **聯邦正典 × k 值**：SEP、IEP、馮友蘭、勞思光、Routledge、Wikidata 各自的名單聯集；k = 被幾個來源收錄，k ≥ 2 才上圖。
- **語義聚合**：重疊點群按主導傳統上色、hover 吐名；同城散開（spiderfy）。
- **人物卡**：點釘針看生平、收錄依據、當年此地屬何政體、著作、生涯軌跡。
- **誠實護欄**：留白勝過填錯；來源偏英語圈的偏誤明列於圖例；機器推導的資料標明出處與近似程度。
- **雙語**：完整中英文介面與生平切換（右上角語言鈕）。

## 收錄規則

須全部滿足：已故且過世滿 20 年、進入母體（Wikidata 或任一權威正典）、k ≥ 2、身份可唯一解析到 Wikidata 實體。完整方法論見 app 內「方法論」分頁。

## 貢獻

**資料即檔案，異議即 PR。** 每位哲學家 = 一個 JSON（`data/philosophers/{QID}.json`），通過 schema 驗證後開 PR 即可。所有中文一律**繁體**；`k`、`centrality`、座標、政體由程序推導，**勿手改**。

## 授權

程式碼（`web/`、`scripts/`）：[MIT](LICENSE)，須保留著作權聲明。資料（`data/`）：**CC BY-SA 4.0**（因內含 CC BY-SA 來源）。逐來源授權詳見上方英文版表格。

## 維護者

**Zaious** — [GitHub](https://github.com/Zaious/PhilosopherAtlas) · [LinkedIn](https://www.linkedin.com/in/zaious/)

</details>
