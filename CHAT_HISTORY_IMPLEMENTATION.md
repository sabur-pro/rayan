# Chat History & 401 Retry Implementation ✅

## Реализовано

### 1. **Автоматическая обработка 401 ошибок**
- ✅ Token refresh callback для всех запросов
- ✅ Автоповтор при 401 для SSE stream
- ✅ Автоповтор при 401 для REST API
- ✅ Детальные логи всех операций

### 2. **История чатов (Бургер меню)**
- ✅ GET `/agent/api/chat/history` - получение списка чатов
- ✅ Боковое меню (drawer) со списком чатов
- ✅ Отображение: title, message_count, дата обновления
- ✅ Анимированное появление/скрытие

### 3. **Загрузка сообщений чата**
- ✅ GET `/agent/api/chat/{chat_id}/messages?limit=50&offset=0`
- ✅ Конвертация в формат ChatSessionMessage
- ✅ Отображение в ChatScreen

### 4. **Пагинация (Infinity Scroll)**
- ✅ Кнопка "Load More" когда `has_more: true`
- ✅ Автоматическая загрузка следующих 50 сообщений
- ✅ Prepend старых сообщений (в хронологическом порядке)
- ✅ Loading indicator для пагинации

### 5. **UI Компоненты**
- ✅ **ChatHistoryDrawer** - боковое меню с историей
- ✅ Кнопка бургер-меню (☰) в header ChatScreen
- ✅ Кнопка "New Chat" (+) в header
- ✅ Load More кнопка с иконкой

### 6. **Переводы**
- ✅ Русский (ru.json)
- ✅ Английский (en.json)
- ⚠️ Таджикский - исправить вручную (поврежден)

## API Endpoints

### 1. История чатов
```http
GET https://api.medlife.tj/agent/api/chat/history
Authorization: Bearer {token}
```

**Response:**
```json
{
  "count": 3,
  "sessions": [
    {
      "id": "c02e4812-308c-4b57-8db5-516a2967e38d",
      "user_id": 12,
      "title": "Что такое артерия плеча?",
      "message_count": 2,
      "created_at": "2025-11-27T05:20:35.003553Z",
      "updated_at": "2025-11-27T05:20:40.0353Z"
    }
  ]
}
```

### 2. Сообщения чата
```http
GET https://api.medlife.tj/agent/api/chat/{chat_id}/messages?limit=50&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "chat_id": "3e9d2d1f-1b44-4d08-beda-3152b84456de",
  "count": 4,
  "messages": [
    {
      "id": 7,
      "role": "user",
      "content": "что такое sacrales laterales?",
      "sequence_num": 1,
      "created_at": "2025-11-27T04:39:34.662902Z"
    },
    {
      "id": 8,
      "role": "assistant",
      "content": "Ответ AI...",
      "sequence_num": 2,
      "created_at": "2025-11-27T04:39:38.547323Z"
    }
  ],
  "pagination": {
    "has_more": false,
    "limit": 50,
    "offset": 0
  },
  "title": "что такое sacrales laterales?",
  "total_messages": 4
}
```

## Обработка 401

### chatService.ts
```typescript
// 1. Установка callback
chatService.setTokenRefreshCallback(async () => {
  const success = await refreshAccessToken();
  return success ? accessToken : null;
});

// 2. Автоматический retry для REST API
private async makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit,
  accessToken: string,
  isRetry: boolean = false
): Promise<T> {
  const response = await fetch(url, {...});
  
  // Handle 401
  if (response.status === 401 && !isRetry) {
    const newToken = await this.handleUnauthorized();
    if (newToken) {
      return this.makeAuthenticatedRequest<T>(url, options, newToken, true);
    }
  }
  //...
}

// 3. Автоматический retry для SSE
this.xhr.onload = async () => {
  if (this.xhr && this.xhr.status === 401) {
    const newToken = await this.handleUnauthorized();
    if (newToken) {
      await this.streamQuery(request, onEvent, newToken);
      resolve();
    }
  }
};
```

## Пагинация

```typescript
const loadMoreMessages = async () => {
  if (!hasMoreMessages || loadingHistory || !chatId) return;
  
  const response = await chatService.getChatMessages(
    chatId, 
    50, 
    currentOffset, 
    accessToken
  );
  
  // Prepend old messages
  setMessages((prev) => [...convertedMessages, ...prev]);
  setHasMoreMessages(response.pagination.has_more);
  setCurrentOffset((prev) => prev + response.messages.length);
};
```

## UI Flow

```
1. ChatScreen открыт
2. Пользователь кликает на ☰ (бургер)
3. ChatHistoryDrawer появляется слева
4. Показывается список чатов из истории
5. Пользователь кликает на чат
6. Загружаются все сообщения этого чата
7. Если has_more: true, показывается кнопка "Load More"
8. Клик на "Load More" → загружается следующая порция
9. Кнопка "+" создает новый чат
```

## Детальные логи

Все операции логируются:
```
[ChatService] Fetching chat history...
[ChatService] Making request to: https://api.medlife.tj/...
[ChatService] Response status: 200
[ChatService] Request successful

[ChatScreen] Selected chat from history: 3e9d2d1f-...
[ChatScreen] Loading chat messages for: 3e9d2d1f-...
[ChatService] Fetching messages for chat 3e9d2d1f-..., limit: 50, offset: 0
[ChatScreen] Loaded 4 messages

[ChatScreen] Loading more messages, offset: 4
[ChatService] Loaded 3 more messages

// При 401:
[ChatService] Received 401, attempting to refresh token...
[ChatService] Handling 401 - attempting token refresh...
[ChatScreen] Token refresh requested
[ChatScreen] Token refreshed successfully
[ChatService] Retrying request with new token...
```

## Использование

### Открыть историю
1. В ChatScreen нажать на кнопку ☰ (menu) в правом верхнем углу

### Загрузить старый чат
1. Выбрать чат из списка истории
2. Автоматически загрузятся все сообщения

### Загрузить больше сообщений
1. Если есть кнопка "Load More" - нажать
2. Догружаются следующие 50 сообщений
3. Процесс повторяется пока `has_more: true`

### Создать новый чат
1. Нажать кнопку "+" в header
2. Очищаются текущие сообщения
3. Сбрасывается chat_id

## Готово! 🎉

Все функции реализованы и работают:
- ✅ 401 retry для SSE и REST
- ✅ История чатов с бургер меню
- ✅ Загрузка сообщений
- ✅ Пагинация (infinity scroll)
- ✅ Детальные логи
- ✅ Переводы (ru, en)
