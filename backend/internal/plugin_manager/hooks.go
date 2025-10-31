package plugin_manager

type HookFunc func(event Event)

type Hooks struct {
	BeforeEmit HookFunc
	AfterEmit  HookFunc
}

