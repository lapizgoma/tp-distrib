package com.tp_distribuidos.backend_rest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendRestApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendRestApplication.class, args);
	}

}
