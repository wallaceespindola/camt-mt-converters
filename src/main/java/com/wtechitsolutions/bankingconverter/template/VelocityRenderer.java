package com.wtechitsolutions.bankingconverter.template;

import jakarta.annotation.PostConstruct;
import org.apache.velocity.VelocityContext;
import org.apache.velocity.app.VelocityEngine;
import org.apache.velocity.runtime.RuntimeConstants;
import org.apache.velocity.runtime.resource.loader.ClasspathResourceLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.StringWriter;
import java.util.Map;

/**
 * Thin wrapper around {@link VelocityEngine} that initialises the engine once via
 * {@link PostConstruct} and exposes a single {@link #render(String, Map)} method.
 * Templates are resolved from the classpath (e.g. {@code templates/mt940.vm}).
 */
@Component
public class VelocityRenderer {

    private static final Logger log = LoggerFactory.getLogger(VelocityRenderer.class);

    private VelocityEngine engine;

    @PostConstruct
    public void init() {
        engine = new VelocityEngine();
        engine.setProperty(RuntimeConstants.RESOURCE_LOADERS, "classpath");
        engine.setProperty("resource.loader.classpath.class", ClasspathResourceLoader.class.getName());
        engine.init();
        log.info("VelocityEngine initialised with classpath resource loader");
    }

    /**
     * Renders a Velocity template by merging it with the supplied context variables.
     *
     * @param templatePath      classpath-relative path to the {@code .vm} template file
     * @param contextVariables  key/value pairs made available inside the template
     * @return the rendered output as a {@link String}
     */
    public String render(String templatePath, Map<String, Object> contextVariables) {
        VelocityContext context = new VelocityContext();
        contextVariables.forEach(context::put);

        StringWriter writer = new StringWriter();
        engine.getTemplate(templatePath).merge(context, writer);
        return writer.toString();
    }
}
