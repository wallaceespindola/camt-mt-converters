package com.wtechitsolutions.bankingconverter.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Exposes application version info via {@code /actuator/health} as the {@code "version"} component.
 *
 * <p>The version string is injected from {@code application.yml} ({@code info.app.version}),
 * which is populated by Maven resource filtering ({@code @project.version@} at build time).
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Component
public class VersionHealthIndicator implements HealthIndicator {

    @Value("${info.app.version:unknown}")
    private String version;

    @Override
    public Health health() {
        return Health.up()
                .withDetail("version", version)
                .build();
    }
}
