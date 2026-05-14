package com.wtechitsolutions.bankingconverter.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Web MVC configuration for SPA static asset serving with client-side routing support.
 *
 * <p>Serves everything under {@code classpath:/static/} and falls back to {@code index.html}
 * for unrecognised paths so that client-side routes work correctly after a hard reload.
 * Backend paths ({@code api/}, {@code actuator/}, {@code v3/}, {@code swagger-ui}) are
 * intentionally not intercepted so Spring MVC can handle them normally.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        // Never intercept backend paths — let Spring MVC handle them
                        if (resourcePath.startsWith("api/")
                                || resourcePath.startsWith("actuator/")
                                || resourcePath.startsWith("v3/")
                                || resourcePath.startsWith("swagger-ui")) {
                            return null;
                        }
                        Resource resource = location.createRelative(resourcePath);
                        if (resource.exists() && resource.isReadable()) {
                            return resource;
                        }
                        // Fall back to index.html for SPA client-side routing
                        Resource index = new ClassPathResource("/static/index.html");
                        return index.exists() ? index : null;
                    }
                });
    }
}
