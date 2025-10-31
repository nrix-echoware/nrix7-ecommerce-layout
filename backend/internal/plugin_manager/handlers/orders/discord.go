package orders

import (
	"context"
	"fmt"

	"ecommerce-backend/internal/plugin_manager"
)

type DiscordPlugin struct {
	BotKey        string
	ChatThreadIDs map[string]string
}

func NewDiscordPlugin(botKey string) *DiscordPlugin {
	return &DiscordPlugin{
		BotKey:        botKey,
		ChatThreadIDs: make(map[string]string),
	}
}

func (d *DiscordPlugin) Name() string {
	return "discord-orders"
}

func (d *DiscordPlugin) HandleEvent(ctx context.Context, event plugin_manager.Event) error {
	switch event.Name {
	case "order.created":
		return d.onOrderCreated(ctx, event)
	case "order.updated":
		return d.onOrderUpdated(ctx, event)
	default:
		return nil
	}
}

func (d *DiscordPlugin) onOrderCreated(ctx context.Context, event plugin_manager.Event) error {
	logMsg := fmt.Sprintf("[DiscordPlugin] Order created: %+v", event.Data)
	fmt.Println(logMsg)
	return nil
}

func (d *DiscordPlugin) onOrderUpdated(ctx context.Context, event plugin_manager.Event) error {
	logMsg := fmt.Sprintf("[DiscordPlugin] Order updated: %+v", event.Data)
	fmt.Println(logMsg)
	return nil
}

