# 🧠 Software Requirements Specification (SRS)

## Project: Plugin Manager Module (Event-driven Integration Layer)

---

## 1. 🎯 Objective

To design and implement a **framework-agnostic, event-driven plugin manager** in Go that enables independent components (e.g., Discord, Telegram, Slack integrations) to respond asynchronously to system events (e.g., order creation, product deletion, etc.) without tight coupling to core services.

This ensures:

* Consistent flow of event handling
* Maintainability
* Extensibility
* Plug-and-play architecture

---

## 2. 🧩 System Overview

The **Plugin Manager** provides:

* An event emission interface (`Emit`)
* Asynchronous event dispatching
* Plugin registration and lifecycle management
* Context-based dependency injection (database, configs, etc.)
* Optional hooks (BeforeEmit, AfterEmit)
* Plugin discovery from the filesystem or config

---

## 3. 🧱 Architecture Overview

### 3.1 High-level Structure

```
plugin_manager/
│
├── manager.go          # Core Manager: runs the event loop, handles async plugins
├── event.go            # Event data structures
├── plugin.go           # Plugin interface
│
├── hooks.go            # Optional: before/after emit hooks
├── registry.go         # Optional: plugin discovery/auto-registration
│
└── handlers/
    ├── orders/
    │   ├── discord.go
    │   └── telegram.go
    └── products/
        └── discord.go
```

---

## 4. 🧩 Design Principles (SOLID & Go Best Practices)

| Principle                     | Description                                                               | Applied In                                  |
| ----------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| **S - Single Responsibility** | Each plugin handles only one responsibility (e.g., send Discord message). | `DiscordPlugin`, `TelegramPlugin`           |
| **O - Open/Closed**           | Add new plugins/events without modifying core manager.                    | `Plugin` interface, dynamic registration    |
| **L - Liskov Substitution**   | Any plugin should replace another without breaking code.                  | All plugins implement `Plugin` interface    |
| **I - Interface Segregation** | Only essential methods in interfaces.                                     | `Plugin` has one method `HandleEvent`       |
| **D - Dependency Inversion**  | Manager depends on abstractions, not implementations.                     | Uses `Plugin` interface, not concrete types |

---

## 5. ⚙️ Core Components

### 5.1 `Event`

```go
type Event struct {
	Name   string
	Target string
	Data   map[string]interface{}
}
```

Represents a single system event.
**Example**: `{"Name": "order.created", "Target": "discord", "Data": {"order_id": 42}}`

---

### 5.2 `Plugin` Interface

```go
type Plugin interface {
	Name() string
	HandleEvent(ctx context.Context, event Event) error
}
```

Each plugin **must** implement this interface.

---

### 5.3 `Manager`

Handles:

* Plugin registration
* Event queueing
* Dispatching
* Asynchronous processing

**Core example:**

```go
manager := plugin_manager.NewManager(100)
manager.Register(orders.NewDiscordPlugin("BOT_KEY"))
go manager.RunForever(context.Background())
manager.Emit(plugin_manager.Event{Name: "order.created", Target: "discord"})
```

---

### 5.4 Hooks (Optional Enhancement)

#### `hooks.go`

```go
package plugin_manager

type HookFunc func(event Event)

type Hooks struct {
	BeforeEmit HookFunc
	AfterEmit  HookFunc
}
```

Integrate with Manager:

```go
type Manager struct {
	plugins  map[string]Plugin
	eventCh  chan Event
	hooks    Hooks
}
```

Usage:

```go
manager.hooks.BeforeEmit = func(e Event) {
	log.Printf("[BeforeEmit] Event: %s", e.Name)
}
```

---

### 5.5 Plugin Discovery

#### `registry.go`

```go
package plugin_manager

import (
	"log"
	"plugin_manager/handlers/orders"
)

func AutoRegister(manager *Manager) {
	manager.Register(orders.NewDiscordPlugin("BOT_KEY"))
	// register more plugins here
	log.Println("[Registry] Plugins auto-registered")
}
```

Later, replace with JSON or YAML configuration:

```json
{
  "plugins": [
    { "name": "discord", "enabled": true, "config": { "botKey": "XXXX" } },
    { "name": "telegram", "enabled": true }
  ]
}
```

---

## 6. 🧩 Example Plugin Implementation

```go
type DiscordPlugin struct {
	BotKey        string
	ChatThreadIDs map[string]string
}

func (d *DiscordPlugin) Name() string { return "discord" }

func (d *DiscordPlugin) HandleEvent(ctx context.Context, event plugin_manager.Event) error {
	switch event.Name {
	case "order.created":
		return d.onOrderCreated(ctx, event)
	default:
		return nil
	}
}

func (d *DiscordPlugin) onOrderCreated(ctx context.Context, event plugin_manager.Event) error {
	fmt.Printf("[DiscordPlugin] Order created: %+v\n", event.Data)
	return nil
}
```

---

## 7. 🧩 Integration with Gin, Fiber, or Echo

Example with Gin:

```go
r.POST("/orders", func(c *gin.Context) {
	var order map[string]interface{}
	c.ShouldBindJSON(&order)

	manager.Emit(plugin_manager.Event{
		Name:   "order.created",
		Target: "discord",
		Data:   order,
	})

	c.JSON(200, gin.H{"status": "event emitted"})
})
```

Because the manager uses `context.Context`, you can inject DB handles, tracing, or request data easily.

---

## 8. ✅ Developer Coding Guidelines

### 8.1 Folder Naming

* Use **snake_case** for folders (`plugin_manager`, `handlers/orders`).
* Use **PascalCase** for exported types.

### 8.2 Code Style

* Prefer small, testable functions.
* Always log errors inside plugin handlers.
* Avoid blocking operations in `HandleEvent`; use goroutines if necessary.

### 8.3 Concurrency

* Always handle goroutines via `WaitGroup`.
* Never block `eventCh` indefinitely.
* Use context cancellation to stop event loops gracefully.

### 8.4 Testing

* Unit test each plugin individually.
* Mock `plugin_manager.Event` to test plugin behavior.
* Integration test manager with multiple concurrent plugins.

---

## 9. 🚀 TODO: Implementation Roadmap (Sequential)

| Step | Task                          | Description                                                                    |
| ---- | ----------------------------- | ------------------------------------------------------------------------------ |
| 1️⃣  | **Setup Core Module**         | Create `plugin_manager` folder with `event.go`, `plugin.go`, and `manager.go`. |
| 2️⃣  | **Implement Manager Logic**   | Add registration, emit, and async event loop.                                  |
| 3️⃣  | **Create Handlers Folder**    | Organize plugins per resource (`orders/discord.go`, etc.).                     |
| 4️⃣  | **Integrate Context**         | Pass `context.Context` from web frameworks to preserve dependencies.           |
| 5️⃣  | **Add Hooks**                 | Implement `BeforeEmit` and `AfterEmit`.                                        |
| 6️⃣  | **Add Auto-Registration**     | Build `registry.go` or JSON-based plugin discovery.                            |
| 7️⃣  | **Write Unit Tests**          | For Manager, Plugin, and Event flow.                                           |
| 8️⃣  | **Add Logging Middleware**    | Wrap plugins with decorator for centralized logging.                           |
| 9️⃣  | **Refactor to SOLID**         | Ensure each plugin follows SRP and OCP.                                        |
| 🔟   | **Integrate in Main Service** | Replace direct calls (e.g., Discord.SendMessage) with event emissions.         |

---

## 10. 🧭 Future Enhancements

1. Event persistence (store events for retries)
2. Priority-based event queues
3. Web dashboard for plugin status monitoring
4. Metrics via Prometheus exporter

---

## ✅ Deliverable Summary

* **Event-driven, decoupled plugin manager**
* **Standardized coding practices** following SOLID
* **Clear directory structure**
* **Async-safe Manager**
* **Plugin hooks and auto-registration system**
* **Ready for integration with Gin/Fiber/Echo**

---

