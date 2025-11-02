
---

# 🧩 Software Requirements Specification (SRS)

## 1. Overview

This feature enables **real-time, per-order communication** between a user and the admin.
Each order automatically gets its own chat thread when created.

The system also includes **two Server-Sent Event (SSE)** endpoints:

* **Admin SSE:** Global event stream for all system updates (orders, messages, etc.).
* **User SSE:** Private per-user event stream for order and message notifications.

---

## 2. Goals

✅ Automatically create a chat thread per order.
✅ Support messages with optional media attachments (≤ 5MB).
✅ Allow only admins to close a thread.
✅ Enable **real-time updates** to admins and users via SSE.
✅ Maintain a lightweight, scalable architecture with minimal dependencies.

---

## 3. Functional Requirements

### 3.1 Thread Management

| Field        | Type     | Description                                   |
| ------------ | -------- | --------------------------------------------- |
| `thread_id`  | UUID     | Unique identifier for the thread              |
| `order_id`   | UUID     | Associated order ID                           |
| `updated_at` | DateTime | Updated when a new message is posted          |
| `is_active`  | Boolean  | Only admin can toggle (true → false to close) |

#### Behavior

* When a new order is created, a new thread is **automatically generated**.
* A thread stays active until **admin explicitly closes it**.
* When a message is added, `updated_at` is refreshed.

---

### 3.2 Messages

| Field             | Type                  | Description                              |
| ----------------- | --------------------- | ---------------------------------------- |
| `message_id`      | UUID                  | Unique message identifier                |
| `thread_id`       | UUID                  | Parent chat thread                       |
| `message_content` | Text                  | Main message text                        |
| `media_data`      | BLOB (optional)       | Binary data for file/image/video (≤ 5MB) |
| `owner`           | Enum(`user`, `admin`) | Message sender type                      |
| `created_at`      | DateTime              | Time message was created                 |
| `updated_at`      | DateTime              | Time message was last updated            |

#### Behavior

* Messages can include text and optionally one attachment (media blob).
* When a new message is created:

  * `thread.updated_at` is updated.
  * A new SSE event is emitted to:

    * **Admin SSE** → global event.
    * **User SSE** → only to the respective user of that order.

---

## 4. Server-Sent Events (SSE)

### 4.1 Admin SSE Endpoint

**Endpoint:**

```
GET /admin/sse
```

**Authentication:**
Admin JWT required.

**Description:**
Continuously streams **global system events** related to resources like orders, messages, etc.

**Event Format:**

```json
{
  "resource": "orders | products | messages | threads",
  "resource_type": "orders.created | orders.updated | messages.new | threads.closed",
  "data": {
    "order_id": "uuid",
    "thread_id": "uuid",
    "meta": { "optional": "data" }
  }
}
```

**Emitted On:**

* New order creation → `orders.created`
* Order update → `orders.updated`
* New message → `messages.new`
* Thread closed → `threads.closed`

---

### 4.2 User SSE Endpoint

**Endpoint:**

```
GET /users/sse/notification/:user_id
```

**Authentication:**
Valid User JWT required.
Must match `:user_id` or email in token claims.

**Description:**
Streams **personalized events** related to the user’s orders or messages.

**Event Format:**

```json
{
  "resource": "orders | messages",
  "resource_type": "orders.updated | messages.new",
  "data": {
    "order_id": "uuid",
    "thread_id": "uuid",
    "meta": { "optional": "details" }
  }
}
```

**Emitted On:**

* User’s order status update → `orders.updated`
* New message in user’s order thread → `messages.new`

**Behavior:**

* SSE emits only events tied to the specific user.
* Stream disconnects if token expires or is invalid.

---

## 5. Data Flow Summary

### Order Creation

1. User creates an order.
2. System auto-creates a chat thread linked to that order.
3. Admin SSE emits:

   ```json
   { "resource": "orders", "resource_type": "orders.created", "data": { "order_id": "..." } }
   ```

### Messaging

1. User or admin sends a message in a thread.
2. Message saved in DB → `thread.updated_at` updated.
3. Emit SSE events:

   * To Admin SSE → `messages.new`
   * To User SSE (specific user) → `messages.new`

### Thread Closure

1. Admin marks thread as inactive (`is_active = false`).
2. Admin SSE emits:

   ```json
   { "resource": "threads", "resource_type": "threads.closed", "data": { "thread_id": "..." } }
   ```

---

## 6. Security

* JWT-based authentication for both admin and user endpoints.
* User SSE stream only for their own data.
* File uploads validated for size (≤ 5MB) and content type (e.g., images, pdfs).
* Optional rate limiting to prevent SSE flooding.

---

## 7. Non-Functional Requirements

| Category          | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Scalability**   | SSE channels handled via lightweight connection pooling (e.g., Redis Pub/Sub, goroutines).     |
| **Reliability**   | If SSE disconnects, client auto-reconnects and receives missed events (using `Last-Event-ID`). |
| **Performance**   | Each SSE event ≤ 2KB payload; events batched if needed.                                        |
| **Extensibility** | Can easily add new event types (e.g., `inventory.updated`) later.                              |

---

## 8. Example Sequence (User → Admin → User)

```
User → POST /orders
         ↓
Thread auto-created (thread_id)
         ↓
Admin SSE: orders.created
         ↓
Admin sends message → messages.new
         ↓
User SSE: messages.new
```

---

## 9. Example DB Schema (PostgreSQL Style)

```sql
CREATE TABLE threads (
  thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(thread_id),
  message_content TEXT,
  media_data BYTEA,
  owner VARCHAR(10) CHECK (owner IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 10. Example Event Emitters (Pseudocode)

```go
// onNewMessage
emitToAdminSSE(Event{
  Resource: "messages",
  ResourceType: "messages.new",
  Data: map[string]any{"thread_id": thread.ID},
})

// if user belongs to order:
emitToUserSSE(userID, Event{
  Resource: "messages",
  ResourceType: "messages.new",
  Data: map[string]any{"thread_id": thread.ID},
})
```

---

## 11. Future Extensions

* Add message “seen” status tracking.
* Support group chat (multiple admins).
* Optional WebSocket fallback for older clients.
* File storage offloading to S3 or MinIO for large files.

---

## 12. Notification Interaction & Deep Linking

### Goal

When a user (or admin) **clicks a notification message**, they should be redirected to a **dedicated context page** based on the resource type — either:

* A **chat thread** page for messages, or
* An **order details** page for order-related updates.

---

### Functional Requirements

#### 12.1 Notification Data Model (Frontend)

Each notification received via SSE should be normalized and stored in client state:

```ts
interface Notification {
  id: string;
  resource: "orders" | "messages";
  resource_type: string;
  data: {
    order_id?: string;
    thread_id?: string;
  };
  created_at: string;
  is_read: boolean;
}
```

#### 12.2 Notification UI

* A **notification icon/bell** (🔔) in the app header (for both admin and user).
* When clicked, shows a dropdown list of latest notifications with:

  * Resource type label (`Order Updated`, `New Message`, etc.)
  * Timestamp
  * Order/Thread ID reference
* New/unread notifications are highlighted.

#### 12.3 Click Action Behavior

| Resource         | Action                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| `messages.new`   | Navigate to `/orders/:order_id/chat` — opens chat view for that order’s thread. |
| `orders.updated` | Navigate to `/orders/:order_id` — opens order details view.                     |
| `threads.closed` | Navigate to `/orders/:order_id` — shows closed thread status.                   |

* If the user is **already viewing** the order page and the new message is related to that order, the chat widget auto-expands and displays the new message inline (Section 13).

#### 12.4 Read Status

* Once a user clicks a notification, mark it as `is_read = true`.
* Optional: Sync read status back to backend with `PATCH /notifications/:id`.

---

## 13. Per-Order Floating Chat UI (User & Admin)

### Goal

Provide an **order-specific floating chat widget** that:

* Opens only within `/orders/:order_id`
* Auto-expands when a new message arrives for the same order
* Syncs messages in near-real-time using SSE data (no polling)
* Appears visually similar to modern messaging UI (like WhatsApp web chat)

---

### Functional Requirements

#### 13.1 UI Layout & Behavior

| Component              | Description                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Chat Toggle Button** | Floating button at bottom-right corner (💬). Click toggles chat visibility.              |
| **Chat Panel**         | Collapsible panel with message list, input box, and send button.                         |
| **Message List**       | Scrollable vertical container showing messages (bubbled layout: left=user, right=admin). |
| **Input Section**      | Textarea + “Send” button + optional file upload icon.                                    |

#### 13.2 UI Flow

1. When user/admin opens `/orders/:order_id`, load associated chat thread:

   ```
   GET /threads?order_id=:order_id
   GET /messages?thread_id=:thread_id
   ```

2. Render messages inside chat widget.

3. SSE connection already running in background:

   * When an event with `messages.new` and matching `order_id` arrives:

     * Append new message to message list.
     * If chat is minimized, show an unread badge on chat button.
     * If chat is open and user is on same order, auto-scroll to bottom.

4. On message send:

   ```
   POST /messages
   {
     thread_id,
     message_content,
     media_data?, // optional blob
     owner: "user" | "admin"
   }
   ```

   * Optimistically append message to chat list.
   * SSE will later confirm and sync state.

#### 13.3 Visual & UX Guidelines

* Rounded chat bubbles with timestamps.
* Auto-scroll to latest message.
* When minimized, show a small **“new message” badge** on chat icon.
* Use fade-in animation on open/close.
* When the thread is closed (`is_active = false`):

  * Disable input field.
  * Display “Thread closed by admin” message.

#### 13.4 Example UI Flow (User Side)

```
User visits /orders/123
 → Floating chat button visible
 → Click button → chat expands (thread loaded)
 → Admin sends new message → SSE triggers → auto-append message
 → User replies → POST /messages → SSE confirms → append to UI
```

#### 13.5 Admin Side

Same logic applies:

* Admin sees all order threads.
* If a user sends a new message (via SSE), the relevant order page (or chat widget) lights up / expands.
* Admin can close a thread → chat locks on both sides.

---
