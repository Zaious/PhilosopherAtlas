# 哲學家地圖 · Philosopher Atlas

古今中外哲學家的互動地圖。235 位哲學家標於一張**去主權化**的底圖上，顏色代表思想傳統、大小代表跨來源共識（k 值）；拉動時間軸，看該年在世者與**當年的歷史政體邊界**。

> 不定義「哲學家是什麼」，改用可複現的程序判定：讓多個權威來源的成員清單聯集生出母體，被越多來源收錄（k 值越高）越是核心。要爭，就對準程序與來源。

<!-- TODO: 上線後補 → 🔗 線上版：https://…  |  📸 截圖：docs/screenshot.png -->

---

## 特色

- **去主權化底圖**：無現代國界；選定年份時才顯示**那一年**的歷史政體邊界（隨拉桿變動，看帝國興滅）。座標是中性錨點，不存「今屬國家」。
- **聯邦正典 × k 值**：SEP、IEP、馮友蘭、勞思光、Routledge、Wikidata 各自的名單聯集；k = 被幾個來源收錄，k ≥ 2 才上圖。
- **語義聚合**：重疊點群按主導傳統上色、hover 吐名；同城散開（spiderfy）。
- **人物卡**：點釘針看生平、收錄依據（哪幾個來源）、當年此地屬何政體、著作、生涯軌跡。
- **誠實護欄**：留白勝過填錯；來源偏英語圈的偏誤明列於圖例；機器推導的資料標明出處與近似程度。

## 收錄規則（誰會上圖）

一個人要出現在圖上，須全部滿足：

1. **已故且過世滿 20 年**（卒年 ≤ 當前年 − 20，隨年滾動）；在世者不收。
2. **進入母體**：Wikidata 標為哲學家（P106），或被任一權威正典來源收錄。
3. **k ≥ 2**：被至少兩個獨立來源收錄。
4. **身份可解析**：能對到唯一 Wikidata 實體。

完整方法論見 [`METHODOLOGY.md`](../METHODOLOGY.md)；k 計算見 [`K_ALGORITHM.md`](../K_ALGORITHM.md)；資料 schema 見 [`schema/philosopher.schema.json`](schema/philosopher.schema.json)。

## 專案結構

```
philosopher-atlas/
├─ web/            前端（靜態，無 build step；D3 v7 自持，無執行期 CDN）
│  ├─ index.html  app.js  style.css
│  ├─ vendor/     d3、topojson（自持）
│  └─ basemap/    Natural Earth 海岸線/河湖 + 歷史邊界快照
├─ data/
│  ├─ philosophers/{QID}.json   每人一檔（唯一真相）
│  └─ atlas_index.json          前端輕量索引
├─ schema/philosopher.schema.json
└─ scripts/validate_philosophers.ps1   CI 驗證器
```

## 本機執行

需 HTTP 伺服器（`fetch` 不能跑在 `file://`）。從**專案根**起服器，讓 `web/` 能相對載入 `../data/`：

```bash
cd philosopher-atlas
python -m http.server 8000
# 開 http://localhost:8000/web/
```

## 部署（GitHub Pages）

從 repo 根部署即可：`web/index.html` 以 `../data/` 相對載入資料，`data/` 是 `web/` 的兄弟目錄。

## 貢獻

**資料即檔案，異議即 PR。** 歡迎補充與指正——原則只有一條：**討論對準程序與來源，而非個人好惡。**

- 每位哲學家 = 一個 JSON（`data/philosophers/{QID}.json`），通過 schema 驗證。
- 要新增、修正收錄、補譯名／座標／政體／著作 → 改對應 JSON、開 Pull Request。
- 認為漏收了誰？指出他在哪個權威來源被收錄即可。
- 所有中文一律**繁體**；`k`、`centrality`、座標、政體由程序推導，**勿手改**。

CI 會驗證 schema、偵測簡體字、檢查 k／centrality 自洽（`scripts/validate_philosophers.ps1`）。

_（規劃中：表單式後台讓不會 Git 的人也能貢獻，見 app 內「路線圖」。）_

## Data & licensing

**程式碼**（`web/`、`scripts/`）：[MIT](LICENSE) — 可自由使用／修改，但須保留著作權聲明。

**資料**（`data/`）：**CC BY-SA 4.0** — 因內含 CC BY-SA 來源（維基百科生平、歷史邊界），採相同方式分享並須標註來源。

逐來源：

| 來源 | 用途 | 授權 |
|---|---|---|
| Wikidata | 母體、生卒、座標、多語名、著作(P800) | CC0 |
| Wikipedia（中文） | 生平簡介（`bio`） | CC BY-SA 4.0 |
| Natural Earth | 海岸線、河流、湖泊 | Public Domain |
| aourednik/historical-basemaps | 時代同步歷史政體邊界（近似、快照粒度） | CC BY-SA |
| SEP、IEP | 收錄成員清單（收錄證據） | 引用 |
| 馮友蘭《中國哲學簡史》、勞思光《新編中國哲學史》、Routledge Philosophers | 收錄成員清單（引用為證據，不重製內容） | 引用 |

歷史邊界與部分政體序列為機器推導、快照近似，非權威定論；現代年份的爭議邊界為資料集自身之描繪。

## 維護者

Zaious
