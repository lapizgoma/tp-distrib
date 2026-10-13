# Etapa BUILD
FROM golang:1.27-alpine AS build
ENV GOTOOLCHAIN=local CGO_ENABLED=0
WORKDIR /src

COPY go.* ./
RUN go mod download

COPY . .
RUN go build -trimpath -ldflags="-s -w" -o /out/proxy .

# Etapa RUNTIME
FROM alpine:3.21
RUN addgroup -S app && adduser -S -G app -u 10001 app
WORKDIR /app

COPY --from=build /out/proxy /app/proxy

USER app
EXPOSE 8080
ENTRYPOINT ["/app/proxy"]
