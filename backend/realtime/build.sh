#!/bin/bash
set -e

echo "Generating protobuf files..."
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/notifications.proto

echo "Building..."
go build -o bin/realtime ./cmd/realtime

echo "Build complete!"

