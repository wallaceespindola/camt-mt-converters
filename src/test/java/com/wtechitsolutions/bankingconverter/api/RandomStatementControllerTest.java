package com.wtechitsolutions.bankingconverter.api;

import com.wtechitsolutions.bankingconverter.domain.LoadProfile;
import com.wtechitsolutions.bankingconverter.random.RandomStatementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RandomStatementController.class)
class RandomStatementControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    RandomStatementService statementService;

    @Test
    void generate_low_profile_returns_200_with_statement_data() throws Exception {
        when(statementService.generate(LoadProfile.LOW))
                .thenReturn(new RandomStatementService.GenerationResult(1L, 5, 100, 10));

        mockMvc.perform(post("/api/random-statements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstStatementId").value(1))
                .andExpect(jsonPath("$.statementsGenerated").value(5))
                .andExpect(jsonPath("$.transactionsGenerated").value(100))
                .andExpect(jsonPath("$.accountsGenerated").value(10))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void generate_medium_profile_delegates_correctly() throws Exception {
        when(statementService.generate(LoadProfile.MEDIUM))
                .thenReturn(new RandomStatementService.GenerationResult(6L, 50, 1000, 100));

        mockMvc.perform(post("/api/random-statements?loadProfile=MEDIUM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statementsGenerated").value(50))
                .andExpect(jsonPath("$.transactionsGenerated").value(1000))
                .andExpect(jsonPath("$.accountsGenerated").value(100));
    }

    @Test
    void generate_high_profile_delegates_correctly() throws Exception {
        when(statementService.generate(LoadProfile.HIGH))
                .thenReturn(new RandomStatementService.GenerationResult(51L, 500, 10000, 1000));

        mockMvc.perform(post("/api/random-statements?loadProfile=HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statementsGenerated").value(500))
                .andExpect(jsonPath("$.transactionsGenerated").value(10000))
                .andExpect(jsonPath("$.accountsGenerated").value(1000));
    }
}
