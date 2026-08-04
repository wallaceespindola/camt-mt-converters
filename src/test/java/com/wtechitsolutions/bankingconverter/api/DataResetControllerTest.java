package com.wtechitsolutions.bankingconverter.api;

import com.wtechitsolutions.bankingconverter.persistence.repository.BankStatementRepository;
import com.wtechitsolutions.bankingconverter.persistence.repository.BankTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DataResetController.class)
@TestPropertySource(properties = "banking.converter.output-directory=target/test-reset-output")
class DataResetControllerTest {

    private static final Path OUTPUT_DIR = Path.of("target/test-reset-output");

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    BankStatementRepository statementRepository;

    @MockitoBean
    BankTransactionRepository transactionRepository;

    @MockitoBean
    JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUpOutputDir() throws Exception {
        Files.createDirectories(OUTPUT_DIR);
        Files.writeString(OUTPUT_DIR.resolve("statement-1.mt940"), ":20:REF");
        Files.writeString(OUTPUT_DIR.resolve(".gitkeep"), "");
    }

    @Test
    void delete_all_wipes_db_history_and_output_files() throws Exception {
        when(statementRepository.count()).thenReturn(5L);
        when(transactionRepository.count()).thenReturn(100L);
        when(jdbcTemplate.update(startsWith("DELETE FROM"))).thenReturn(3);

        mockMvc.perform(delete("/api/data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statementsDeleted").value(5))
                .andExpect(jsonPath("$.transactionsDeleted").value(100))
                .andExpect(jsonPath("$.jobsDeleted").value(3))
                .andExpect(jsonPath("$.filesDeleted").value(1))
                .andExpect(jsonPath("$.timestamp").exists());

        verify(statementRepository).deleteAll();
        verify(jdbcTemplate).update("DELETE FROM BATCH_JOB_INSTANCE");
        assertThat(OUTPUT_DIR.resolve("statement-1.mt940")).doesNotExist();
        assertThat(OUTPUT_DIR.resolve(".gitkeep")).exists();
    }
}
