package products

import (
	"context"
	"fmt"

	"ecommerce-backend/common/constants"
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
	return constants.PLUGIN_TARGET_DISCORD_PRODUCTS
}

func (d *DiscordPlugin) HandleEvent(ctx context.Context, event plugin_manager.Event) error {
	switch event.Name {
	case constants.EVENT_PRODUCT_CREATED:
		return d.onProductCreated(ctx, event)
	case constants.EVENT_PRODUCT_DELETED:
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

