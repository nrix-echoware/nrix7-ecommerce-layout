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

type DatabaseConfig struct {
	Host           string `mapstructure:"host"`
	Port           int    `mapstructure:"port"`
	User           string `mapstructure:"user"`
	Password       string `mapstructure:"password"`
	Name           string `mapstructure:"name"`
	SSLMode        string `mapstructure:"sslmode"`
	TimeZone       string `mapstructure:"timezone"`
	MaxOpenConns   int    `mapstructure:"max_open_conns"`
	MaxIdleConns   int    `mapstructure:"max_idle_conns"`
	ConnMaxMinutes int    `mapstructure:"conn_max_minutes"`
}

type Config struct {
	Database            DatabaseConfig     `mapstructure:"database"`
	RateLimit           RateLimitConfig    `mapstructure:"ratelimit"`
	AdminAPIKey         string             `mapstructure:"admin_api_key"`
	AudioStorage        AudioStorageConfig `mapstructure:"audio_storage"`
	GrpcPort            string             `mapstructure:"grpc_port"`
	RealtimeServiceAddr string             `mapstructure:"realtime_service_addr"`
	JWTAccessSecret     string             `mapstructure:"jwt_access_secret"`
	JWTRefreshSecret    string             `mapstructure:"jwt_refresh_secret"`
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
	_ = v.BindEnv("database.host", "DB_HOST")
	_ = v.BindEnv("database.port", "DB_PORT")
	_ = v.BindEnv("database.user", "DB_USER")
	_ = v.BindEnv("database.password", "DB_PASSWORD")
	_ = v.BindEnv("database.name", "DB_NAME")
	_ = v.BindEnv("database.sslmode", "DB_SSLMODE")
	_ = v.BindEnv("database.timezone", "DB_TIMEZONE")
	_ = v.BindEnv("database.max_open_conns", "DB_MAX_OPEN_CONNS")
	_ = v.BindEnv("database.max_idle_conns", "DB_MAX_IDLE_CONNS")
	_ = v.BindEnv("database.conn_max_minutes", "DB_CONN_MAX_MINUTES")
	_ = v.BindEnv("ADMIN_API_KEY")
	_ = v.BindEnv("audio_storage.path", "AUDIO_STORAGE_PATH")
	_ = v.BindEnv("audio_storage.base_url", "AUDIO_STORAGE_BASE_URL")
	_ = v.BindEnv("audio_storage.max_payload_size_mb", "AUDIO_STORAGE_MAX_PAYLOAD_SIZE_MB")
	_ = v.BindEnv("grpc_port")
	_ = v.BindEnv("realtime_service_addr")
	_ = v.BindEnv("jwt_access_secret", "JWT_ACCESS_SECRET")
	_ = v.BindEnv("jwt_refresh_secret", "JWT_REFRESH_SECRET")
	v.SetDefault("database.host", "postgres")
	v.SetDefault("database.port", 5432)
	v.SetDefault("database.user", "ecommerce")
	v.SetDefault("database.password", "ecommerce")
	v.SetDefault("database.name", "ecommerce")
	v.SetDefault("database.sslmode", "disable")
	v.SetDefault("database.timezone", "UTC")
	v.SetDefault("database.max_open_conns", 50)
	v.SetDefault("database.max_idle_conns", 10)
	v.SetDefault("database.conn_max_minutes", 5)
	v.SetDefault("admin_api_key", os.Getenv("ADMIN_API_KEY"))
	v.SetDefault("ratelimit.default.post", 300)
	v.SetDefault("ratelimit.default.get", 100)
	v.SetDefault("audio_storage.path", "/app/data/audio_contacts")
	v.SetDefault("audio_storage.base_url", "http://localhost:8080/api")
	v.SetDefault("audio_storage.max_payload_size_mb", 10)
	v.SetDefault("grpc_port", "10000")
	v.SetDefault("realtime_service_addr", "localhost:9999")
	v.SetDefault("jwt_access_secret", "")
	v.SetDefault("jwt_refresh_secret", "")
	if err := v.ReadInConfig(); err != nil {
		// fallback to env/defaults
	}
	var c Config
	if err := v.Unmarshal(&c); err != nil {
		panic(err)
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
