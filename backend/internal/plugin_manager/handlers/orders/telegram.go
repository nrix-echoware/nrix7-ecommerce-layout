package orders

import (
	"context"
	"fmt"

	"ecommerce-backend/internal/plugin_manager"
)

type TelegramPlugin struct {
	BotToken string
	ChatID   string
}

func NewTelegramPlugin(botToken, chatID string) *TelegramPlugin {
	return &TelegramPlugin{
		BotToken: botToken,
		ChatID:   chatID,
	}
}

func (t *TelegramPlugin) Name() string {
	return "telegram-orders"
}

func (t *TelegramPlugin) HandleEvent(ctx context.Context, event plugin_manager.Event) error {
	switch event.Name {
	case "order.created":
		return t.onOrderCreated(ctx, event)
	case "order.updated":
		return t.onOrderUpdated(ctx, event)
	default:
		return nil
	}
}

func (t *TelegramPlugin) onOrderCreated(ctx context.Context, event plugin_manager.Event) error {
	logMsg := fmt.Sprintf("[TelegramPlugin] Order created: %+v", event.Data)
	fmt.Println(logMsg)
	return nil
}

func (t *TelegramPlugin) onOrderUpdated(ctx context.Context, event plugin_manager.Event) error {
	logMsg := fmt.Sprintf("[TelegramPlugin] Order updated: %+v", event.Data)
	fmt.Println(logMsg)
	return nil
}

