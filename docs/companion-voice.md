# 陪伴光點與語音

## 光點跟隨

`CompanionPresence` 是蓋在整個指揮中心上的 DOM 層，不進 Three.js 場景。它用彈簧（剛性與阻尼）追指標，所以會稍微落後，停在游標右下方，瞳孔再看向指標。指標停下就停在最後的位置；游標真正離開視窗（座標超出畫面）才緩緩回到中下方待命點。移到內嵌 iframe 時座標仍在視窗內，光點會留在最後位置，不會突然回家。

`pointer-events: none`，行星、側欄、分隔線、設定與連結都點得到。動畫在 `requestAnimationFrame` 裡直接改 `transform`。`prefers-reduced-motion: reduce` 時不跑動畫迴圈，光點固定在待命位置。

背景的 HudCanvas 光暈也改成阻尼跟隨，並拿掉貼著游標的十字準星，避免看起來像第二個游標。

## 語音

右下角「語音」，或在非輸入框按 `V`。

- 語音轉文字：`SpeechRecognition` / `webkitSpeechRecognition`，語言 `zh-TW`
- 朗讀：`speechSynthesis`，優先選 `zh-TW` 或名稱含台灣／繁體的聲音
- 「靜音」只關朗讀，存在 `localStorage` 鍵 `jarvis.voice.muted.v1`
- 意圖比對在 `src/lib/jarvisVoice.ts`，不呼叫外部聊天 API

麥克風被拒或不支援時，畫面用繁體中文說明，星系、AI 艦隊與設定仍可用。

Chrome 的 Web Speech 辨識可能由瀏覽器自己的語音服務處理。這不是本專案加的後端，音訊也不會送到 Firebase 或自建 API。

## 主人聲紋

未登錄時，任何語音都不會執行指令。登錄要朗讀三句：

1. J.A.R.V.I.S.，我是指揮中心的主人。
2. 鐵人指揮中心，請確認我的聲音。
3. 只有我的聲音可以下達指令。

麥克風同時錄音。每段在瀏覽器裡用 [ReDimNet-B2](https://huggingface.co/OpenVoiceOS/redimnet-b2-vox2-onnx)（Apache-2.0，約 22 MB，`public/models/redimnet-b2-vox2.onnx`）抽出 192 維向量。推理用 `onnxruntime-web` 1.18 的單執行緒 WASM（`ort-wasm-simd.wasm`，約 11 MB），`numThreads = 1`，因此不需要 Cross-Origin Isolation，內嵌 iframe 不受影響。

三個向量先互相核對（對質心的餘弦相似度至少 0.62），通過後才把質心與各段向量寫進 IndexedDB（`jarvis.voiceprint`）。原始音訊不保存。

之後每次指令都會先比對整段語音與質心。門檻 **0.50**（程式裡不接受更低的值）。在公開的中文／英文說話者樣本上，同一人完整語句大約 0.73 以上，其他人大約 0.34 以下。太短、太安靜或低於門檻時，只說「無法確認是您的聲音」，不開啟模組、艦隊或設定。

重新登錄與清除聲紋會先要求朗讀確認句並通過目前聲紋，失敗就保留舊檔。第一次登錄沒有舊檔可核對：能操作這台瀏覽器的人可以建立第一份聲紋。聲紋也擋不住播放主人錄音的重放。

第一次使用會下載模型與 WASM，之後由瀏覽器快取。比對時畫面會停在「比對聲紋」。

## 瀏覽器

| 能力 | Chrome / Edge 桌面 | Safari | Firefox |
| --- | --- | --- | --- |
| 跟隨光點 | 支援 | 支援 | 支援 |
| 語音辨識 | 支援 | 部分支援 | 多半不支援 |
| 朗讀 | 支援，視系統聲音 | 支援 | 支援 |
| 聲紋 WASM | 支援 SIMD 的現代版本 | 較新版本 | 支援 SIMD 的版本 |

沒有辨識時不能下語音指令，但其餘指揮中心照常使用。
