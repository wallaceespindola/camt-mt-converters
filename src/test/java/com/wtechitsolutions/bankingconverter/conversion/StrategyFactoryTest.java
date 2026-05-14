package com.wtechitsolutions.bankingconverter.conversion;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class StrategyFactoryTest {

    @Autowired
    StatementExportStrategyFactory factory;

    @ParameterizedTest
    @MethodSource("prowideStrategies")
    void resolves_all_prowide_strategies(ConversionTargetFormat fmt) {
        StatementExportStrategy strategy = factory.getStrategy(fmt, ConversionEngine.PROWIDE);
        assertThat(strategy).isNotNull();
        assertThat(strategy.targetFormat()).isEqualTo(fmt);
        assertThat(strategy.engine()).isEqualTo(ConversionEngine.PROWIDE);
    }

    @ParameterizedTest
    @MethodSource("velocityStrategies")
    void resolves_all_velocity_strategies(ConversionTargetFormat fmt) {
        StatementExportStrategy strategy = factory.getStrategy(fmt, ConversionEngine.VELOCITY);
        assertThat(strategy).isNotNull();
        assertThat(strategy.engine()).isEqualTo(ConversionEngine.VELOCITY);
    }

    @Test
    void throws_for_unknown_combination() {
        assertThatThrownBy(() -> factory.getStrategy(ConversionTargetFormat.MT940, ConversionEngine.JAKARTA_XML_BINDING))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("MT940");
    }

    @Test
    void has_strategy_returns_true_for_registered() {
        assertThat(factory.hasStrategy(ConversionTargetFormat.MT940, ConversionEngine.PROWIDE)).isTrue();
    }

    @Test
    void has_strategy_returns_false_for_missing() {
        assertThat(factory.hasStrategy(ConversionTargetFormat.MT940, ConversionEngine.JAKARTA_XML_BINDING)).isFalse();
    }

    static Stream<Arguments> prowideStrategies() {
        return Stream.of(
                Arguments.of(ConversionTargetFormat.MT940),
                Arguments.of(ConversionTargetFormat.MT942),
                Arguments.of(ConversionTargetFormat.CAMT052),
                Arguments.of(ConversionTargetFormat.CAMT053)
        );
    }

    static Stream<Arguments> velocityStrategies() {
        return Stream.of(
                Arguments.of(ConversionTargetFormat.MT940),
                Arguments.of(ConversionTargetFormat.MT942),
                Arguments.of(ConversionTargetFormat.CAMT052),
                Arguments.of(ConversionTargetFormat.CAMT053)
        );
    }
}
