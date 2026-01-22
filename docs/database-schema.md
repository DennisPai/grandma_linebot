# 資料庫設計文件

## 資料庫資訊

- **類型**: PostgreSQL 15
- **ORM**: Prisma
- **字元集**: UTF-8

## 資料表結構

### User（用戶資料表）

儲存 Line 用戶的基本資訊和 AI 提取的畫像。

| 欄位名 | 類型 | 說明 | 索引 |
|--------|------|------|------|
| userId | String | Line User ID（主鍵） | PK |
| displayName | String? | 顯示名稱 | - |
| firstContactAt | DateTime | 首次聯絡時間 | - |
| lastActiveAt | DateTime | 最後活躍時間 | ✅ |
| profileSummary | Json? | AI 提取的用戶畫像 | - |
| preferences | Json? | 用戶偏好設定 | - |

**關聯**:
- `conversations`: 一對多
- `morningSchedule`: 一對一

---

### Conversation（對話記錄表）

儲存所有對話記錄，支援審核功能。

| 欄位名 | 類型 | 說明 | 索引 |
|--------|------|------|------|
| id | Int | 自動遞增 ID（主鍵） | PK |
| userId | String | 關聯用戶 | ✅ (複合) |
| role | String | 角色：user/assistant/system | - |
| content | Text | 對話內容 | - |
| hasImage | Boolean | 是否包含圖片 | - |
| imageUrl | String? | 圖片 URL | - |
| metadata | Json? | 額外資訊（情緒、主題等） | - |
| status | String | 審核狀態 | ✅ |
| originalContent | Text? | 原始內容（如被編輯） | - |
| editedBy | String? | 編輯者 | - |
| editedAt | DateTime? | 編輯時間 | - |
| timestamp | DateTime | 建立時間 | ✅ (複合) |

**索引**:
- `(userId, timestamp)`: 快速查詢特定用戶的對話
- `status`: 查詢待審核對話

---

### MorningSchedule（早安訊息排程表）

管理每個用戶的早安訊息發送時間。

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| userId | String | 關聯用戶（主鍵） |
| nextSendTime | DateTime | 下次發送時間 |
| sendWindowStart | String | 時間窗口開始（如 "07:00"） |
| sendWindowEnd | String | 時間窗口結束（如 "08:30"） |
| timezone | String | 時區（預設 Asia/Taipei） |
| enabled | Boolean | 是否啟用 |

---

### Document（文檔知識庫表）

儲存管理員上傳的參考文檔。

| 欄位名 | 類型 | 說明 | 索引 |
|--------|------|------|------|
| id | Int | 自動遞增 ID（主鍵） | PK |
| title | String | 文檔標題 | - |
| content | Text | 文檔內容 | - |
| category | String | 分類（自由定義） | ✅ |
| tags | String[] | 標籤陣列 | - |
| isIndexed | Boolean | 是否已向量化 | ✅ |
| chromaId | String? | ChromaDB 向量 ID | - |
| referenceCount | Int | 被引用次數 | - |
| lastUsedAt | DateTime? | 最後使用時間 | - |
| uploadedBy | String | 上傳者 | - |
| uploadedAt | DateTime | 上傳時間 | - |
| updatedAt | DateTime | 更新時間 | - |

---

### PendingMessage（待審核訊息表）

儲存待發送的訊息（特別是早安訊息）。

| 欄位名 | 類型 | 說明 | 索引 |
|--------|------|------|------|
| id | Int | 自動遞增 ID（主鍵） | PK |
| userId | String | 目標用戶 | ✅ |
| messageType | String | 訊息類型 | - |
| content | Text | 訊息內容 | - |
| imageUrl | String? | 圖片 URL | - |
| status | String | 狀態 | ✅ (複合) |
| approvedBy | String? | 批准者 | - |
| reviewedAt | DateTime? | 審核時間 | - |
| scheduledAt | DateTime? | 預定發送時間 | ✅ (複合) |
| sentAt | DateTime? | 實際發送時間 | - |
| createdAt | DateTime | 建立時間 | - |

**Enum Values**:
- `messageType`: morning | reply | proactive
- `status`: pending | approved | rejected | sent

**索引**:
- `(status, scheduledAt)`: 查詢待發送訊息
- `userId`: 查詢特定用戶的訊息

---

### AdminUser（後台管理員表）

儲存後台管理員資訊。

| 欄位名 | 類型 | 說明 |
|--------|------|------|
| id | String | UUID（主鍵） |
| email | String | Email（唯一） |
| name | String | 名稱 |
| provider | String | OAuth 提供者 |
| providerId | String | OAuth ID |
| role | String | 角色：admin/viewer |
| createdAt | DateTime | 建立時間 |
| lastLoginAt | DateTime | 最後登入時間 |

**Unique Constraints**:
- `email`
- `(provider, providerId)`

---

### SystemConfig（系統配置表）

儲存系統配置（JSON 格式）。

| 欄位名 | 類型 | 說明 | 索引 |
|--------|------|------|------|
| id | Int | 自動遞增 ID | PK |
| key | String | 配置鍵名（唯一） | ✅ |
| value | Text | 配置值（JSON） | - |
| description | String? | 說明 | - |
| updatedBy | String? | 更新者 | - |
| updatedAt | DateTime | 更新時間 | - |

**預設配置**:
- `ai_models_config`: AI 模型配置

---

### APIUsageLog（API 使用記錄表）

追蹤所有 API 使用情況和成本。

| 欄位名 | 類型 | 說明 | 索引 |
|--------|------|------|------|
| id | Int | 自動遞增 ID | PK |
| service | String | 服務名稱 | ✅ (複合) |
| model | String | 模型名稱 | - |
| tier | String | 免費/付費 | ✅ (複合) |
| operation | String? | 操作類型 | - |
| tokensUsed | Int? | Token 數量 | - |
| cost | Float | 成本（美元） | - |
| userId | String? | 關聯用戶 | ✅ (複合) |
| success | Boolean | 是否成功 | - |
| errorMessage | String? | 錯誤訊息 | - |
| timestamp | DateTime | 時間戳記 | ✅ (複合) |

**索引**:
- `(service, timestamp)`: 按服務查詢使用記錄
- `(tier, timestamp)`: 按付費等級統計成本
- `(userId, timestamp)`: 查詢特定用戶的 API 使用

**Enum Values**:
- `service`: gemini | banana_pro | line_api | elder_meme_generation
- `tier`: free | paid
- `operation`: chat | embedding | image_generation | realistic_photo | elder_meme_complete

---

## 資料庫遷移

使用 Prisma Migrate：

```bash
# 開發環境
npx prisma migrate dev

# 生產環境
npx prisma migrate deploy
```

## 備份策略

建議每日自動備份：

```bash
pg_dump -h host -U user -d dbname > backup_$(date +%Y%m%d).sql
```

或使用 Zeabur PostgreSQL 的自動備份功能。

## 查詢優化建議

1. **對話記錄查詢**：
   - 使用 `(userId, timestamp)` 複合索引
   - 限制查詢筆數（`LIMIT 10`）
   - 考慮分頁

2. **用戶畫像查詢**：
   - 快取用戶畫像（TTL 5 分鐘）
   - 減少 JSON 欄位的深度查詢

3. **API 使用統計**：
   - 使用 `GROUP BY` 聚合查詢
   - 限制時間範圍（最近 7 天）
   - 考慮建立物化視圖（Materialized View）

---

## 資料保留政策

- **對話記錄**：永久保留（或按需求設定保留期限）
- **待審核訊息**：發送後保留 30 天
- **API 使用記錄**：保留 90 天
- **圖片檔案**：Google Drive 永久保留
