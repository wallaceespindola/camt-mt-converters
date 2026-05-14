package com.wtechitsolutions.bankingconverter.conversion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class StatementExportStrategyFactory {

    private static final Logger log = LoggerFactory.getLogger(StatementExportStrategyFactory.class);

    private final Map<StatementExportStrategyKey, StatementExportStrategy> strategies;

    public StatementExportStrategyFactory(List<StatementExportStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toUnmodifiableMap(
                        StatementExportStrategy::key,
                        Function.identity()
                ));
        log.info("Registered {} export strategies: {}", strategies.size(),
                strategies.keySet().stream()
                        .map(k -> k.targetFormat() + "/" + k.engine())
                        .sorted()
                        .collect(Collectors.joining(", ")));
    }

    public StatementExportStrategy getStrategy(ConversionTargetFormat targetFormat, ConversionEngine engine) {
        StatementExportStrategyKey key = new StatementExportStrategyKey(targetFormat, engine);
        StatementExportStrategy strategy = strategies.get(key);
        if (strategy == null) {
            throw new IllegalArgumentException(
                    "No export strategy registered for: " + key +
                    ". Available: " + strategies.keySet().stream()
                            .map(k -> k.targetFormat() + "/" + k.engine())
                            .sorted()
                            .collect(Collectors.joining(", ")));
        }
        return strategy;
    }

    public boolean hasStrategy(ConversionTargetFormat targetFormat, ConversionEngine engine) {
        return strategies.containsKey(new StatementExportStrategyKey(targetFormat, engine));
    }
}
