package com.wtechitsolutions.bankingconverter.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ConversionWarmupRunnerTest {

    @Autowired
    ConversionWarmupRunner runner;

    @Test
    void warmup_exports_all_combinations_without_errors() {
        assertThatCode(() -> runner.run(null)).doesNotThrowAnyException();
    }
}
