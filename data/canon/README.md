# data/canon/ — 印本正典人工謄錄區

此處放**無法機讀的印本成員正典**，人工謄錄一次後即可機讀。
這是 federated 修正西方偏誤的必要件，也是面向社群的 PR 入口。

## 待建：`canon_zh.json`

馮友蘭《中國哲學史》、勞思光《新編中國哲學史》的**人名/章節成員清單**。
格式建議：

```json
{
  "source": "馮友蘭《中國哲學史》",
  "members": [
    { "name_zh": "孔子", "name_latin": "Confucius", "chapter": "第四章" },
    { "name_zh": "墨子", "name_latin": "Mozi", "chapter": "第五章" },
    { "name_zh": "韓非", "name_latin": "Han Fei", "chapter": "第十三章" }
  ]
}
```

抓取 pipeline 的 Stage 1 會把這裡每個 member 當 `canon_list`（權重 1.0）。
**貢獻方式**：謄一份、附頁碼/章節、發 PR。歡迎熟中哲者認領。

> 同理可開 `canon_indian.json`（Potter）、`canon_islamic.json`（Brill EI）等，
> 各傳統 README 待補，留白勝過填錯。
