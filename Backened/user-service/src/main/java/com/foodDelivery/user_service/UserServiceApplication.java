package com.foodDelivery.user_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class UserServiceApplication {

	public static void main(String[] args) {
		loadEnv();
		SpringApplication.run(UserServiceApplication.class, args);
	}

	private static void loadEnv() {
		Path[] candidates = {
			Paths.get(".env"),
			Paths.get("../../.env"),
			Paths.get("../.env")
		};
		for (Path path : candidates) {
			if (Files.exists(path)) {
				try {
					for (String line : Files.readAllLines(path)) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;
						int idx = line.indexOf('=');
						String key = line.substring(0, idx).trim();
						String val = line.substring(idx + 1).trim();
						if (System.getProperty(key) == null && System.getenv(key) == null) {
							System.setProperty(key, val);
						}
					}
				} catch (Exception ignored) {}
				break;
			}
		}
	}

}

