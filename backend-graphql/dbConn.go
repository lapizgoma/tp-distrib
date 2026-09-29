package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/go-sql-driver/mysql"
)

var db *sql.DB

func initDB() {
	cfg := mysql.NewConfig()
	cfg.User = os.Getenv("TP_DISTRIB_DB_USERNAME")
	cfg.Passwd = os.Getenv("TP_DISTRIB_DB_PASSWORD")
	cfg.Net = "tcp"
	cfg.Addr = os.Getenv("TP_DISTRIB_DB_ADDR")
	cfg.DBName = os.Getenv("TP_DISTRIB_DB_NAME")

	var err error
	db, err = sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		log.Fatalf("error al abrir la base de datos: %v", err)
	}

	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("error al conectar la base de datos: %v", err)
	}
}
