package plugin_manager

import "context"

type Plugin interface {
	Name() string
	HandleEvent(ctx context.Context, event Event) error
}

