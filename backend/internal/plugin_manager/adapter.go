package plugin_manager

type EventEmitterAdapter struct {
	manager *Manager
}

func NewEventEmitterAdapter(manager *Manager) *EventEmitterAdapter {
	return &EventEmitterAdapter{manager: manager}
}

func (e *EventEmitterAdapter) Emit(event interface{}) {
	evtMap, ok := event.(map[string]interface{})
	if !ok {
		return
	}

	name, _ := evtMap["name"].(string)
	target, _ := evtMap["target"].(string)
	data, _ := evtMap["data"].(map[string]interface{})

	e.manager.Emit(Event{
		Name:   name,
		Target: target,
		Data:   data,
	})
}

