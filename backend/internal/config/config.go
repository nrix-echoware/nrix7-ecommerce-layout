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

type Config struct {
	DBFile       string
	RateLimit    RateLimitConfig
	AdminAPIKey  string `mapstructure:"admin_api_key"`
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
