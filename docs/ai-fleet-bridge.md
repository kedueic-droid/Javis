# AI 艦隊橋接

指揮中心是 Firebase Hosting 上的靜態 SPA。Grok Bot 代理人沒有穩定的公開 https 聊天網址，因此 AI 艦隊不走應用行星的 iframe，而是同頁的代理人橋接，外加一個尚未接通的派工佇列。

## 現況

代理人名冊寫在 [`src/data/fleet.ts`](../src/data/fleet.ts)。識別碼只用於深連結與中介資料：

`grokbot://app/v1/agent?id=<uuid>`

瀏覽器不一定認得這個 scheme。介面只提供複製，不會假設它一定能被開啟。實務上仍是到 Grok Bot 側邊欄找同名代理人。

| 資料 | localStorage 鍵 | 內容 |
| --- | --- | --- |
| 任務筆記 | `jarvis.fleet.notes.v1` | `{ version: 1, notes: { [agentId]: string } }` |
| 派工佇列 | `jarvis.fleet.queue.v1` | `{ version: 1, commands: FleetCommand[] }` |

`FleetCommand.status` 預留三態：

- `pending`：使用者在指令監視台按「排入佇列」後寫入。這是目前唯一會產生的狀態。
- `sent`：留給未來連接器，表示指令已交給該代理人。本 PR 不會把任何指令改成這個狀態。
- `result`：留給未來回報。介面有空狀態文案，沒有假資料，也沒有假 API。

應用行星的匯出 JSON（`jarvis.portal.v1`）不含艦隊筆記與佇列。重設應用預設也不會清掉這兩把鍵。

## 與應用行星的差異

應用行星有 `url`，啟動方式是內嵌 iframe 或新分頁。艦隊行星沒有 `url`。點選、側欄、指令監視台都打開代理人橋接。預設啟動方式若設成「新分頁」，只影響應用，不影響艦隊。

## 未來連接器

要真正喚醒 Grok Bot，應另做一個受信任的 connector，不要把憑證打進 Hosting 的靜態檔。

建議分工：

1. 使用者在指揮中心把指令留在 `pending`。
2. Connector 讀取或接收該筆指令。靜態站本身沒有伺服器，所以傳送方式要由 connector 決定，例如使用者明示貼上、或之後加一個可選的 webhook URL（存在瀏覽器、預設空白）。
3. Connector 以 Grok Bot 可接受的方式指定 `agentId` 並送出 `text`。
4. 成功交給代理人之後，把同一筆 `commandId` 標成 `sent`。
5. 若代理人有可回寫的摘要，再標成 `result` 並附上回覆文字。指揮中心只顯示回寫，不在前端偽造。

尚未實作的 payload 形狀：

```json
{
  "commandId": "fleet-xxxxxxxx",
  "agentId": "10b5b176-3aa6-4729-be99-850e6ef0b2ac",
  "agentName": "策略長",
  "text": "確認 JARVIS 與產品優先序",
  "deepLink": "grokbot://app/v1/agent?id=10b5b176-3aa6-4729-be99-850e6ef0b2ac"
}
```

Webhook URL、簽章與 Grok 憑證留在 connector 的環境，不進這個 repo 的建置輸出。
