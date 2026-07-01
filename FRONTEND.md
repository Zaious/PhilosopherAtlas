# FRONTEND — Philosopher Atlas 前端定案規格

承接 `METHODOLOGY.md` §3–7（底圖/投影/時間軸/cluster/技術棧）。本文把定案決策 + 資料到位後的補充，收斂成可實作規格。

---

## 1. 定案基礎（沿用 METHODOLOGY，不重議）

- **底圖**：Natural Earth 洲級向量（world-atlas TopoJSON，含 `CONTINENT` 欄），**無國界線**，按洲填色、洲內無線；50m 精度（小島才在）。自持靜態向量，**絕不**用商用圖磚 / PNG。
- **投影**：D3-geo，Plate Carrée（`geoEquirectangular`）預設；同一投影函式驅動底圖 + 釘針（數學對齊）。（Robinson/NaturalEarth1 切換 = 後期選項）
- **時間軸**：滑動**單點** scrubber（停某年），非區間。
- **聚合**：supercluster，**帶語義**（見 §4），同城 spiderfy。
- **載體**：靜態站（GitHub Pages 相容）。`atlas_index.json` 初始渲染；點擊時 lazy-load `philosophers/{QID}.json`。

## 2. 四項新決策（2026-07 定案）

| # | 決策 | 選定 |
|---|---|---|
| D1 | scrubber × 多地點稀疏日期 | **primary(出生錨)貫穿生卒全期當預設位置；死亡/工作/居住點為靜態次要標記**（選取時才在地圖顯示 + panel 列出），不參與 scrubber 時間判定 |
| D2 | 釘針顏色編碼 | **tradition（11 類正典池）**——縮遠即見思想史地理分布，西方傾斜一目了然 |
| D3 | k=1 contested 是否上圖 | **不放，維持 k≥2 嚴格門檻**。故 centrality 視覺軸退化（全 core）；METHODOLOGY §2「contested 可見」意圖**明確擱置**（記錄在案） |
| D4 | MVP 範圍 | **完整版一次做**（見 §5 功能清單全做） |

## 3. 視覺編碼（資料 → 視覺）

| 資料欄位 | 視覺 |
|---|---|
| `tradition` | 釘針**顏色**（11 色盤，D2） |
| `k`（2–5） | 釘針**大小/不透明度**（k5 最顯著；review=true 即 k==2 可加細微「暫定」邊框） |
| `primary` region | 主釘針（地圖預設位置） |
| 非 primary regions | 選取時顯示的小型空心標記 + panel 條列（D1） |
| `active_regions` 多點 | 選取時連**遷徙軌跡線**（birth→work→death 排序，日期稀疏故非精確年） |
| `polity_sequence` @ scrubber 年 | 選取/hover 時顯示「此刻此地屬何政體」；`polity_source` 分級樣式：**curated 清晰 / historical-basemaps 淡化 + `~`** |
| `date_certainty` | approximate/uncertain 者標記可略帶模糊（次要） |
| `membership_sources` | panel 的**證據鏈**（見 §5 panel） |

## 4. Cluster 語義（METHODOLOGY §5）

- supercluster，**不用預設數字灰圈**。
- cluster 顏色 = **該群主導 tradition**（與釘針同色盤，D2；非年代）。
- 大小按人數；hover 吐前幾個名字。
- 同城完全重合 → **spiderfy** 散開；遠距重疊才 cluster。

## 5. 功能清單（完整版）

1. **底圖**：world-atlas 50m，`topojson.merge` 按 `CONTINENT` 溶解成無界洲塊，洲色填充。
2. **釘針層**：235 primary 點，tradition 上色、k 定大小。
3. **scrubber**：年份滑桿（約 −624 Thales → 2004）。顯示 `birth_year ≤ Y ≤ death_year` 者。
4. **cluster**：supercluster 語義群 + spiderfy。
5. **選取 panel**（點釘針）——專案靈魂「要爭請爭程序」：
   - name_zh / name_en、生卒 + date_certainty、tradition
   - **k + 證據鏈**：哪幾票（WD / SEP / IEP / 馮友蘭 / 勞思光 / Routledge）+ entry_type
   - active_regions（birth/work/death + 迷你軌跡）
   - **當前 scrubber 年的 polity**（含 provenance 分級）
   - works（P800）、sitelinks、WD 連結
6. **polity 時間顯示**：scrubber 移動時，選取者的當年政體即時更新。
7. **遷徙軌跡**：選取時畫 active_regions 連線。
8. **篩選**：tradition 圖例（可 toggle，兼作**偏誤誠實圖例**——明示 european 152 等分布）、k 範圍。
9. **搜尋**：按 name_zh / name_en 定位。

## 6. 技術架構

- **無 build step**：`index.html` + ES modules，D3 v7 + supercluster 由 CDN/ESM 載入。
- **檔案**（置於 `philosopher-atlas/web/`）：
  - `index.html`、`app.js`（主）、`style.css`
  - `map.js`（底圖+投影+zoom）、`cluster.js`（supercluster+spiderfy）、`panel.js`（證據鏈）、`scrubber.js`、`legend.js`（tradition 圖例/篩選/偏誤）
  - 資料由 `../data/atlas_index.json` + `../data/philosophers/*.json` 相對載入
- **色盤**：11 tradition 各一色（色盲友善、洲塊底色需低飽和以襯釘針）。
- **效能**：235 點極輕；supercluster + canvas/SVG 皆可，優先 SVG（互動/樣式簡單）。

## 6b. 實作決策（2026-07，開工時）

- **視覺風格**：**古地圖/羊皮紙風**。海=淡羊皮紙、陸=較深茶色、海岸線=手繪抖動墨線（SVG `feTurbulence`+`feDisplacementMap`，仍純向量非 PNG）、serif 字體、sepia UI。
- **自持資產**：`web/vendor/`（d3.v7 / topojson-client）+ `web/basemap/countries-50m.json`（world-atlas，CC0）。**無執行期 CDN**（呼應「世界觀完全自控」）。
- **底圖用 `land` 非 continent 填色**：world-atlas@2 無 `CONTINENT` 欄；改用無界 `land` 物件單一羊皮紙填色 → 更貼古地圖美學、國界零、tradition 釘針成唯一顏色。
- **cluster 用螢幕空間貪婪分群**（非 supercluster）：235 點量級下，螢幕距離貪婪分群確定性正確、免 mercator-zoom 對應；語義（主導 tradition 上色、大小按數、hover 名字、同城 spiderfy）不變。
- **只有 7 個 tradition 實際出現**（european/chinese/greek/islamic/indian/jewish/african）；japanese/korean/latin_american 目前 0 人，色盤仍定義備用。

## 7. 明確擱置（記錄，不做）

- k=1 contested 圖層（D3）
- Robinson/NaturalEarth1 投影切換
- ctext works 驗證層（需 API key）
- polity dataset 名稱正規化字典（Ming/Qing 等）與 pre-100CE 補全

## 8. 硬規則遵循

- 底圖**無國界線**；不顯示「今屬國家」（polity 只顯示**歷史**主權 + provenance）。
- 所有中文 UI 文案繁體。
- k / centrality 只讀資料、前端不重算。
- 偏誤誠實：tradition 分布明示於圖例。
