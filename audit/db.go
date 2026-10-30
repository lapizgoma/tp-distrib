package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/go-sql-driver/mysql"
)

func connectDB() *sql.DB {
	cfg := mysql.NewConfig()
	cfg.User = os.Getenv("TP_DISTRIB_DB_USERNAME")
	cfg.Passwd = os.Getenv("TP_DISTRIB_DB_PASSWORD")
	cfg.Net = "tcp"
	cfg.Addr = os.Getenv("TP_DISTRIB_DB_ADDR")
	cfg.DBName = os.Getenv("TP_DISTRIB_DB_NAME")
	cfg.ParseTime = true
	cfg.Loc = time.UTC
	cfg.Params = map[string]string{"charset": "utf8mb4"}

	if cfg.Addr == "" {
		cfg.Addr = "localhost:3306"
	}

	db, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		log.Fatalf("ERROR: no se pudo abrir MySQL: %v", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ERROR: no se pudo conectar a MySQL: %v", err)
	}

	log.Printf("INFO: conectado a MySQL en %s/%s", cfg.Addr, cfg.DBName)
	return db
}
