package com.wtechitsolutions.bankingconverter.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * OpenAPI / Swagger UI configuration. Active only under the {@code dev} profile to avoid
 * exposing API documentation in production environments.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Configuration
@Profile("dev")
public class OpenApiConfig {

    @Bean
    public OpenAPI bankingConverterOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Banking Statement Converter Platform")
                        .description("""
                                Converts internal banking domain data to MT940, MT942, camt.052, \
                                camt.053 formats via Spring Batch and the Strategy Pattern.
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Wallace Espindola")
                                .email("wallace.espindola@gmail.com")
                                .url("https://www.linkedin.com/in/wallaceespindola/")));
    }
}
