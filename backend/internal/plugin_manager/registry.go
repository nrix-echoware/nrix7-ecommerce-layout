package plugin_manager

import "log"

func AutoRegister(manager *Manager, plugins []Plugin) {
	for _, plugin := range plugins {
		manager.Register(plugin)
	}
	log.Println("[Registry] Plugins registered")
}

