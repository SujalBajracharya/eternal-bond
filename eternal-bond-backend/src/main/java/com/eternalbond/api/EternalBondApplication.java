package com.eternalbond.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EternalBondApplication {

    public static void main(String[] args) {
        SpringApplication.run(EternalBondApplication.class, args);
    }
}
