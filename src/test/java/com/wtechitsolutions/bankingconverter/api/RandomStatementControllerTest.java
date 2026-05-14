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
    void generate_returns_200_with_statement_data() throws Exception {
        when(statementService.generate(LoadProfile.LOW))
                .thenReturn(new RandomStatementService.GenerationResult(1L, 1, 10));

        mockMvc.perform(post("/api/random-statements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstStatementId").value(1))
                .andExpect(jsonPath("$.statementsGenerated").value(1))
                .andExpect(jsonPath("$.transactionsGenerated").value(10))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void generate_high_profile_delegates_correctly() throws Exception {
        when(statementService.generate(LoadProfile.HIGH))
                .thenReturn(new RandomStatementService.GenerationResult(5L, 10, 1000));

        mockMvc.perform(post("/api/random-statements?loadProfile=HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statementsGenerated").value(10))
                .andExpect(jsonPath("$.transactionsGenerated").value(1000));
    }
}
