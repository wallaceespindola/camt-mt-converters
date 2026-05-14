package com.wtechitsolutions.bankingconverter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Banking Statement Converter Platform.
 *
 * <p>Converts internal domain data to MT940, MT942, camt.052 and camt.053 banking files
 * using Spring Batch and the Strategy Pattern.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@SpringBootApplication
public class BankingConverterApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankingConverterApplication.class, args);
    }
}
