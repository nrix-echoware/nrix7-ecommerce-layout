package plugin_manager

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"
)

type Manager struct {
	plugins map[string]Plugin
	eventCh chan Event
	hooks   Hooks
	mu      sync.RWMutex
	wg      sync.WaitGroup
}

func NewManager(bufferSize int) *Manager {
	return &Manager{
		plugins: make(map[string]Plugin),
		eventCh: make(chan Event, bufferSize),
		hooks:   Hooks{},
	}
}

func (m *Manager) Register(plugin Plugin) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.plugins[plugin.Name()] = plugin
	logrus.Infof("[PluginManager] Registered plugin: %s", plugin.Name())
}

func (m *Manager) Emit(event Event) {
	if m.hooks.BeforeEmit != nil {
		m.hooks.BeforeEmit(event)
	}

	select {
	case m.eventCh <- event:
		if m.hooks.AfterEmit != nil {
			m.hooks.AfterEmit(event)
		}
	default:
		logrus.Warnf("[PluginManager] Event channel full, dropping event: %s", event.Name)
	}
}

func (m *Manager) RunForever(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			logrus.Info("[PluginManager] Shutting down event loop")
			close(m.eventCh)
			m.wg.Wait()
			return
		case event, ok := <-m.eventCh:
			if !ok {
				return
			}
			m.handleEvent(ctx, event)
		}
	}
}

func (m *Manager) handleEvent(ctx context.Context, event Event) {
	m.mu.RLock()
	plugin, exists := m.plugins[event.Target]
	m.mu.RUnlock()

	if !exists {
		logrus.Warnf("[PluginManager] Plugin not found for target: %s", event.Target)
		return
	}

	m.wg.Add(1)
	go func() {
		defer m.wg.Done()
		if err := plugin.HandleEvent(ctx, event); err != nil {
			logrus.Errorf("[PluginManager] Error handling event %s in plugin %s: %v", event.Name, plugin.Name(), err)
		}
	}()
}

func (m *Manager) SetHooks(hooks Hooks) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.hooks = hooks
}

