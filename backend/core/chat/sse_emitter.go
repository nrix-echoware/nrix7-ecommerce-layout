package chat

type SSEEventEmitter struct {
	hub *SSEHub
}

func NewSSEEventEmitter(hub *SSEHub) *SSEEventEmitter {
	return &SSEEventEmitter{hub: hub}
}

func (e *SSEEventEmitter) EmitAdminEvent(event interface{}) {
	eventMap, ok := event.(map[string]interface{})
	if !ok {
		return
	}
	
	resource, _ := eventMap["resource"].(string)
	resourceType, _ := eventMap["resource_type"].(string)
	data, _ := eventMap["data"].(map[string]interface{})
	
	e.hub.BroadcastToAdmin(SSEMessage{
		Resource:     resource,
		ResourceType: resourceType,
		Data:         data,
	})
}

func (e *SSEEventEmitter) EmitUserEvent(userID string, event interface{}) {
	eventMap, ok := event.(map[string]interface{})
	if !ok {
		return
	}
	
	resource, _ := eventMap["resource"].(string)
	resourceType, _ := eventMap["resource_type"].(string)
	data, _ := eventMap["data"].(map[string]interface{})
	
	e.hub.BroadcastToUser(userID, SSEMessage{
		Resource:     resource,
		ResourceType: resourceType,
		Data:         data,
	})
}

