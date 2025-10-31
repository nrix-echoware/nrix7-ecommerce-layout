package products

import (
	"context"
	"fmt"

	"ecommerce-backend/internal/plugin_manager"
)

type DiscordPlugin struct {
	BotKey string
}

func NewDiscordPlugin(botKey string) *DiscordPlugin {
	return &DiscordPlugin{
		BotKey: botKey,
	}
}

func (d *DiscordPlugin) Name() string {
	return "discord-products"
}

func (d *DiscordPlugin) HandleEvent(ctx context.Context, event plugin_manager.Event) error {
	switch event.Name {
	case "product.created":
		return d.onProductCreated(ctx, event)
	case "product.deleted":
		return d.onProductDeleted(ctx, event)
	default:
		return nil
	}
}

func (d *DiscordPlugin) onProductCreated(ctx context.Context, event plugin_manager.Event) error {
	logMsg := fmt.Sprintf("[DiscordPlugin] Product created: %+v", event.Data)
	fmt.Println(logMsg)
	return nil
}

func (d *DiscordPlugin) onProductDeleted(ctx context.Context, event plugin_manager.Event) error {
	logMsg := fmt.Sprintf("[DiscordPlugin] Product deleted: %+v", event.Data)
	fmt.Println(logMsg)
	return nil
}

