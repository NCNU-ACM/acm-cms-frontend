# NCNU ACM CMS 後台介面

ACM 官網內容管理系統（CMS）的前端介面，使用 Vue 3 建置的單頁應用程式（SPA），社團幹部透過這個介面管理官網的所有動態內容。

## 專案架構

本專案是 ACM 官網系統的其中一部分，整體系統由四個獨立 repo 組成：

| Repo | 說明 |
|---|---|
| [acm-website](https://github.com/NCNU-ACM/acm-website) | 官網前台 |
| [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend) | CMS 後端 API |
| [acm-cms-frontend](https://github.com/NCNU-ACM/acm-cms-frontend)（本專案） | CMS 後台介面 |
| [acm-backup](https://github.com/NCNU-ACM/acm-backup) | 內容資料獨立備份 |

本專案透過 HTTP 呼叫 `acm-cms-backend` 提供的 API，不直接存取檔案系統。
幹部登入 → CMS 後台介面（本專案） → CMS 後端 API → 寫入官網 content/

## 功能

提供五個管理頁面，皆支援新增、編輯、刪除與分頁：

| 頁面 | 說明 |
|---|---|
| 小組管理 | 編輯小組名稱、介紹、主題色、排序 |
| 活動管理 | 編輯活動公告（標題、日期、地點、內容、連結、報名連結） |
| 幹部管理 | 依學期管理各小組幹部（姓名、職稱、自介、聯絡方式） |
| 成果展示管理 | 編輯成果展示項目，可關聯活動、上傳圖集 |
| 全體通知管理 | 編輯全體通知，可控制是否顯示在官網 |

## 認證

登入頁面輸入帳密後，向後端 `/auth/login` 取得 token，儲存在瀏覽器 `localStorage`。之後每個請求會自動帶上 `Authorization: Bearer {token}` header。

為了避免使用者填寫表單填到一半才發現登入過期，介面會：
- 進入頁面時立即向 `/auth/verify` 確認 token 是否有效
- 之後每 5 分鐘背景自動檢查一次
- token 失效時自動清除並重新整理頁面，導回登入畫面

## 本機開發

### 環境需求
- Node.js 18 以上
- 需要 `acm-cms-backend` 在本機 `http://127.0.0.1:8000` 運行中

### 安裝與啟動

```bash
npm install
npm run dev
```

開發伺服器預設啟動在 `http://localhost:5173`。

### API 位址設定

`src/api/client.js` 裡的 `API_BASE` 設定後端 API 的位址，本機開發為 `http://127.0.0.1:8000`，正式環境需要改成實際的後端網址。

## 專案結構
src/

├── api/

│   └── client.js          # API 請求封裝

├── components/

│   ├── GroupsManager.vue

│   ├── EventsManager.vue

│   ├── MembersManager.vue

│   ├── ShowcaseManager.vue

│   ├── AnnouncementsManager.vue

│   └── Pagination.vue     # 共用分頁元件

└── App.vue                 # 登入畫面 + 側邊導覽

## 技術棧

- [Vue 3](https://vuejs.org/)（Composition API、`<script setup>`）
- [Vite](https://vite.dev/)

## 相關專案

- [acm-website](https://github.com/NCNU-ACM/acm-website) — 官網前台
- [acm-cms-backend](https://github.com/NCNU-ACM/acm-cms-backend) — CMS 後端 API
- [acm-backup](https://github.com/NCNU-ACM/acm-backup) — 內容資料獨立備份