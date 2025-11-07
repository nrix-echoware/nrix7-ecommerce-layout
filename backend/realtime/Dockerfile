FROM golang:1.23-alpine AS builder

RUN apk add git build-base protobuf protobuf-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

COPY . .

RUN protoc --go_out=. --go_opt=module=ecommerce-realtime \
    --go-grpc_out=. --go-grpc_opt=module=ecommerce-realtime \
    proto/auth.proto proto/notifications.proto

RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo \
    -ldflags='-w -s' -o main ./cmd/realtime

FROM alpine:latest

RUN apk add ca-certificates wget

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 9998 9999

CMD ["./main"]

