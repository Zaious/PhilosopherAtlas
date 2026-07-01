# 來源清單與 k 值公式

philosopher-atlas 以「聯邦正典」架構決定誰進入地圖：每個來源是聯邦成員，各自投票，k 值是得票加總。此文件定義所有成員來源、各自角色與 k 計算公式。

**規則：任何 `k` 或 `centrality` 的變更必須透過修改此文件並重跑 pipeline，禁止手填個人 JSON。CI 自動擋。**

---

## k 計算公式

```
k(p) = Σ  contribution(p, S)
       S ∈ SOURCES

contribution(p, S) =
  1.0   if p 在來源 S 有 dedicated 條目（專屬哲學家頁面）
  1.0   if p 在來源 S 的成員清單中（canon_list）
  0.5   if p 在來源 S 的主題文章中被點名（topic）
  0.0   if p 在來源 S 中找不到

規則：
  - 同一來源 S 的多型別，取最高值，不重複加。
  - 不同來源的貢獻獨立加總。
  - 「勞思光《新編中國哲學史》」四卷合為一票：
    無論哲學家出現在幾卷，contribution 最多 1.0。
```

**理論最高 k（已確認來源）：** 6.0（Wikidata + SEP + IEP + Routledge + 馮友蘭 + 勞思光；Adamson 已剔除）

---

## 來源清單

### Tier A — 資料脊椎

| 來源 ID | 全稱 | 端點 | 貢獻型別 | 最高權重 |
|---|---|---|---|---|
| `wikidata` | Wikidata | `https://query.wikidata.org/sparql` | `dedicated` | 1.0 |

Wikidata 同時提供起底母體、多語名稱、生卒年、座標，是 Stage 0 的資料脊椎。某人在 Wikidata 有哲學家身分的獨立條目（非消歧頁）即得 dedicated 1.0。

### Tier B — 西方學術正典

| 來源 ID | 全稱 | 端點 | 貢獻型別 | 最高權重 |
|---|---|---|---|---|
| `sep` | Stanford Encyclopedia of Philosophy | `https://plato.stanford.edu/contents.html` | `canon_list` / `topic` | 1.0 / 0.5 |
| `iep` | Internet Encyclopedia of Philosophy | `https://iep.utm.edu/` | `canon_list` / `topic` | 1.0 / 0.5 |
| `routledge_series` | Routledge Philosophers 書系（33 本，人工維護） | 紙本 | `canon_list` | 1.0 |

SEP/IEP：為某人開設獨立條目 → canon_list 1.0；僅在主題條目中被點名 → topic 0.5（同來源取高值）。Routledge 書系以書名對應人物。

### Tier C — 非西方印本正典

| 來源 ID | 全稱 | 端點 | 貢獻型別 | 最高權重 |
|---|---|---|---|---|
| `feng_youlan` | 馮友蘭《中國哲學簡史》（A Short History of Chinese Philosophy, 1948） | 紙本，見 `data/canon/canon_feng_youlan.json` | `canon_list` | 1.0 |
| `lao_siguang` | 勞思光《新編中國哲學史》（第一至三卷下，全四冊合為一票） | 紙本，見 `data/canon/canon_lao_siguang.json` | `canon_list` | 1.0 |

兩書各為獨立一票，共同構成中文哲學正典的聯邦投票。勞思光四冊覆蓋不同時代，同一哲學家理論上最多出現在一冊；pipeline 計算時以 `lao_siguang` 為來源 ID 做去重，確保四冊合計對每人最多貢獻 1.0。`canon_zh.json` 保留各冊來源條目以供完整稽核，但 k 採計時視為同一來源。

### Tier C — 待納入（未來 PR 擴充）

| 來源 ID | 全稱 | 說明 |
|---|---|---|
| `karl_potter` | Karl Potter《Encyclopedia of Indian Philosophies》 | 待確認版本與可及性 |
| `brill_islam` | Brill《Encyclopaedia of Islam》 | 待確認授權與可及性 |
| `heisig` | Heisig《Japanese Philosophy: A Sourcebook》 | 待確認版本與可及性 |

納入新來源流程：PR 修改此文件 → pipeline 重跑 → 所有受影響的個人 JSON 自動更新。

---

## 收錄門檻與 centrality

```
K_MIN = 2.0

k ≥ 3.0          → centrality: "core"
k = 2.0           → centrality: "core"（標 review: true 供人工確認）
1.0 ≤ k < 2.0    → centrality: "contested"
k < 1.0           → 不收入 atlas（排除，但 membership_sources 仍保留記錄）
```

`centrality` 欄位由 pipeline 計算後寫入，CI 驗算與 membership_sources 自洽；不吻合即擋。

---

## 著作驗證來源（不算 k）

| 來源 ID | 全稱 | 用途 |
|---|---|---|
| `ctext` | ctext.org API | 驗證 `works[]` 欄位中文獻存在性，不影響 k |

---

## 已剔除來源

| 來源 | 理由 |
|---|---|
| Routledge Encyclopedia of Philosophy（REP 百科） | 付費牆，無法公開查證，移出 k 池 |
| `adamson`（History of Philosophy without Gaps 播客） | 全站 403，無法取得集數清單；且播客集數覆蓋偏西方古代，無法作為全球公平正典（2026-06 放棄） |

注意：REP 百科 ≠ Routledge Philosophers 書系，前者已剔除，後者（Tier B）仍在。

---

## 個人 JSON membership_sources 範例

```json
{
  "id": "confucius",
  "name_zh": "孔子",
  "k": 5.0,
  "centrality": "core",
  "membership_sources": [
    { "source_id": "wikidata",      "type": "dedicated",  "weight": 1.0 },
    { "source_id": "sep",           "type": "canon_list", "weight": 1.0 },
    { "source_id": "iep",           "type": "canon_list", "weight": 1.0 },
    { "source_id": "feng_youlan",   "type": "canon_list", "weight": 1.0 },
    { "source_id": "lao_siguang",   "type": "canon_list", "weight": 1.0, "note": "Vol.1 第三章" }
  ]
}
```

k = 1.0 + 1.0 + 1.0 + 1.0 + 1.0 = 5.0，可由 membership_sources 完全重算，無隱藏參數。

---

## 公開查證與 PR 說明

- `k` 由 `membership_sources` 完全決定，可獨立驗算
- 新增來源：PR 修改此文件，更新 pipeline 爬蟲，重跑後個人 JSON 自動更新
- 質疑某人 k 值：PR 附上反例來源 → pipeline 重算 → 自動更新
- 質疑公式設計（如調整 topic 權重）：PR 修改此文件公式段落，附理由，社群討論
