package config

import (
	"os"
	"sync"

	"github.com/spf13/viper"
)

type Config struct {
	Port             string
	GrpcPort         string
	AdminAPIKey      string
	JWTAccessSecret  string
	JWTRefreshSecret string
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

	v.BindEnv("PORT")
	v.BindEnv("GRPC_PORT")
	v.BindEnv("ADMIN_API_KEY")
	v.BindEnv("JWT_ACCESS_SECRET")
	v.BindEnv("JWT_REFRESH_SECRET")

	v.SetDefault("port", "9998")
	v.SetDefault("grpc_port", "9999")
	v.SetDefault("admin_api_key", os.Getenv("ADMIN_API_KEY"))
	v.SetDefault("jwt_access_secret", os.Getenv("JWT_ACCESS_SECRET"))
	v.SetDefault("jwt_refresh_secret", os.Getenv("JWT_REFRESH_SECRET"))

	if err := v.ReadInConfig(); err != nil {
		// fallback to env/defaults
	}

	var c Config
	if err := v.Unmarshal(&c); err != nil {
		panic(err)
	}

	if c.Port == "" {
		c.Port = v.GetString("port")
	}
	if c.GrpcPort == "" {
		c.GrpcPort = v.GetString("grpc_port")
	}
	if c.AdminAPIKey == "" {
		c.AdminAPIKey = v.GetString("admin_api_key")
	}
	if c.JWTAccessSecret == "" {
		c.JWTAccessSecret = v.GetString("jwt_access_secret")
	}
	if c.JWTRefreshSecret == "" {
		c.JWTRefreshSecret = v.GetString("jwt_refresh_secret")
	}

	return &c
}

func Get() *Config {
	once.Do(func() {
		cfg = loadConfig()
	})
	return cfg
}
