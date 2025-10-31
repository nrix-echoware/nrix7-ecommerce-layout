package plugin_manager

type Event struct {
	Name   string
	Target string
	Data   map[string]interface{}
}

