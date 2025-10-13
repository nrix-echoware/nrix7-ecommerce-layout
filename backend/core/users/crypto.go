package users

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
)

// XOR encryption using admin API key
func xorEncrypt(plaintext, key string) string {
	if len(key) == 0 {
		key = getDefaultKey()
	}

	result := make([]byte, len(plaintext))
	keyBytes := []byte(key)

	for i := 0; i < len(plaintext); i++ {
		result[i] = plaintext[i] ^ keyBytes[i%len(keyBytes)]
	}

	return hex.EncodeToString(result)
}

// XOR decryption using admin API key
func xorDecrypt(ciphertext, key string) (string, error) {
	if len(key) == 0 {
		key = getDefaultKey()
	}

	decoded, err := hex.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode hex: %v", err)
	}

	result := make([]byte, len(decoded))
	keyBytes := []byte(key)

	for i := 0; i < len(decoded); i++ {
		result[i] = decoded[i] ^ keyBytes[i%len(keyBytes)]
	}

	return string(result), nil
}

// Hash password using XOR encryption
func HashPassword(password string) string {
	return xorEncrypt(password, getDefaultKey())
}

// Verify password against hash
func VerifyPassword(password, hash string) bool {
	decrypted, err := xorDecrypt(hash, getDefaultKey())
	if err != nil {
		return false
	}
	return password == decrypted
}

// Generate a random token
func GenerateToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Get default encryption key from environment or use fallback
func getDefaultKey() string {
	key := os.Getenv("ADMIN_API_KEY")
	if key == "" {
		// Fallback key for development (should be set in production)
		key = "nrix7-ecommerce-default-key-2024"
	}
	return key
}
