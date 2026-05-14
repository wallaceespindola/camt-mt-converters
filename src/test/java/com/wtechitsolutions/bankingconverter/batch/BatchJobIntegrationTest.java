package com.wtechitsolutions.bankingconverter.batch;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.domain.LoadProfile;
import com.wtechitsolutions.bankingconverter.random.RandomStatementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BatchJobIntegrationTest {

    @Autowired
    RandomStatementService randomStatementService;

    @Autowired
    BatchJobService batchJobService;

    @Test
    void end_to_end_mt940_prowide_conversion() {
        RandomStatementService.GenerationResult generated = randomStatementService.generate(LoadProfile.LOW);
        assertThat(generated.firstStatementId()).isNotNull();

        BatchJobService.BatchJobResult result = batchJobService.launch(
                generated.firstStatementId(), ConversionTargetFormat.MT940, ConversionEngine.PROWIDE);

        assertThat(result.status()).isEqualTo("COMPLETED");
        assertThat(result.outputFile()).endsWith(".mt940");
        assertThat(result.fileContent()).contains(":20:", ":25:");
    }

    @Test
    void end_to_end_camt053_prowide_conversion() {
        RandomStatementService.GenerationResult generated = randomStatementService.generate(LoadProfile.LOW);

        BatchJobService.BatchJobResult result = batchJobService.launch(
                generated.firstStatementId(), ConversionTargetFormat.CAMT053, ConversionEngine.PROWIDE);

        assertThat(result.status()).isEqualTo("COMPLETED");
        assertThat(result.outputFile()).endsWith(".camt053.xml");
        assertThat(result.fileContent()).contains("camt.053.001.08");
    }

    @Test
    void history_shows_completed_jobs() {
        RandomStatementService.GenerationResult generated = randomStatementService.generate(LoadProfile.LOW);
        batchJobService.launch(generated.firstStatementId(), ConversionTargetFormat.MT942, ConversionEngine.PROWIDE);

        assertThat(batchJobService.getHistory()).isNotEmpty();
    }
}
