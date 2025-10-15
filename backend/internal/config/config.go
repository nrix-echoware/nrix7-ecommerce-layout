package config

import (
	"os"
	"sync"

	"github.com/spf13/viper"
)

type RateLimitSetting struct {
	Post int `mapstructure:"post"`
	Get  int `mapstructure:"get"`
}

type RateLimitConfig struct {
	Default     RateLimitSetting            `mapstructure:"default"`
	Controllers map[string]RateLimitSetting `mapstructure:"controllers"`
}

type AudioStorageConfig struct {
	Path             string `mapstructure:"path"`
	BaseURL          string `mapstructure:"base_url"`
	MaxPayloadSizeMB int    `mapstructure:"max_payload_size_mb"`
}

type Config struct {
	DBFile        string
	RateLimit     RateLimitConfig
	AdminAPIKey   string            `mapstructure:"admin_api_key"`
	AudioStorage  AudioStorageConfig `mapstructure:"audio_storage"`
}

var (
	cfg  *Config
	once sync.Once
)

func loadConfig() *Config {
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	_ = v.BindEnv("DB_FILE")
	_ = v.BindEnv("ADMIN_API_KEY")
	v.SetDefault("dbfile", os.Getenv("DB_FILE"))
	v.SetDefault("admin_api_key", os.Getenv("ADMIN_API_KEY"))
	v.SetDefault("ratelimit.default.post", 300)
	v.SetDefault("ratelimit.default.get", 100)
	v.SetDefault("audio_storage.path", "/tmp/audio_contacts")
	v.SetDefault("audio_storage.base_url", "http://localhost:8080/api")
	v.SetDefault("audio_storage.max_payload_size_mb", 10)
	if err := v.ReadInConfig(); err != nil {
		// fallback to env/defaults
	}
	var c Config
	if err := v.Unmarshal(&c); err != nil {
		panic(err)
	}
	if c.DBFile == "" {
		c.DBFile = v.GetString("dbfile")
	}
	if c.AdminAPIKey == "" {
		c.AdminAPIKey = v.GetString("admin_api_key")
	}
	return &c
}

func Get() *Config {
	once.Do(func() {
		cfg = loadConfig()
	})
	return cfg
}
