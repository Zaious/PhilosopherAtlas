# web/ — Philosopher Atlas 前端

古地圖/羊皮紙風格的哲學家互動地圖。純靜態、無 build step、D3 v7（自持，無執行期 CDN）。
設計規格見上層 `../FRONTEND.md`。

## 執行（本機）

需用 HTTP 伺服器（`fetch` 不能跑在 `file://`）。從**專案根**（`philosopher-atlas/`）起服器，讓 `web/` 能相對載入 `../data/`：

```bash
cd philosopher-atlas
python -m http.server 8000
# 開 http://localhost:8000/web/
```

（`web/atlas_index.json` 是預覽備援副本；正式資料源是 `../data/atlas_index.json`。app 先試 `../data/`，失敗才用本地副本。）

## GitHub Pages

從 repo 根部署即可：`web/index.html` 以 `../data/` 相對載入哲學家資料，`data/` 是 `web/` 的兄弟目錄。

## 檔案

| 檔 | 作用 |
|---|---|
| `index.html` | 結構 + 載入順序 |
| `style.css` | 羊皮紙主題 |
| `app.js` | 全部邏輯（底圖/投影/zoom、螢幕空間 cluster+spiderfy、scrubber、panel 證據鏈、polity、遷徙軌跡、篩選、搜尋） |
| `vendor/` | d3.v7、topojson-client（自持） |
| `basemap/countries-50m.json` | world-atlas（CC0），用 `land` 物件無界填色 |

## 功能對應（FRONTEND.md）

- 顏色 = tradition（7 類實際出現）；大小 = k（2–5）；k==2 虛線邊＝暫定
- scrubber：勾掉「全部時代」即進入單點年份；顯示該年在世者
- 點釘針 → 右欄 panel：**收錄依據（k 證據鏈）**、該年**政體**（curated 清晰／dataset 淡化加 `~`）、地點、著作
- 選取時畫**遷徙軌跡**（birth→work→death）
- 左上圖例：點按篩選傳統，並**誠實標示西方偏誤**
- 右上搜尋：中/英文名定位

## 已知限制（見 FRONTEND.md §7）

polity dataset 版粗糙（快照粒度、名稱未正規化、pre-100CE 不覆蓋）；ctext works 驗證、k=1 圖層、投影切換皆擱置。
