package com.wtechitsolutions.bankingconverter.api;

import com.wtechitsolutions.bankingconverter.api.dto.RandomStatementResponse;
import com.wtechitsolutions.bankingconverter.domain.LoadProfile;
import com.wtechitsolutions.bankingconverter.random.RandomStatementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * REST controller for random banking statement data generation.
 *
 * <p>Exposes a single endpoint to seed the H2 database with randomised {@code BankStatement}
 * and {@code BankTransaction} records driven by the selected {@link LoadProfile}. The generated
 * statement IDs can then be used as inputs to the conversion endpoints.
 *
 * @author Wallace Espindola (wallace.espindola@gmail.com)
 */
@RestController
@RequestMapping("/api/random-statements")
@Tag(name = "Statements", description = "Random banking statement data generation")
public class RandomStatementController {

    private static final Logger log = LoggerFactory.getLogger(RandomStatementController.class);

    private final RandomStatementService statementService;

    public RandomStatementController(RandomStatementService statementService) {
        this.statementService = statementService;
    }

    /**
     * Generates and persists random banking statement data using the specified load profile.
     *
     * @param loadProfile {@code LOW} (10 accounts, 5 statements, 100 transactions),
     *                    {@code MEDIUM} (100 accounts, 50 statements, 1 000 transactions), or
     *                    {@code HIGH} (1 000 accounts, 500 statements, 10 000 transactions);
     *                    defaults to {@code LOW}
     * @return a {@link RandomStatementResponse} containing generation counts and the first statement ID
     */
    @PostMapping
    @Operation(
            summary = "Generate random banking statement data",
            description = "Generates random BankStatement + BankTransaction records and persists them to H2. "
                    + "LOW: 10 accounts · 5 statements · 100 transactions. "
                    + "MEDIUM: 100 accounts · 50 statements · 1 000 transactions. "
                    + "HIGH: 1 000 accounts · 500 statements · 10 000 transactions. "
                    + "Defaults to LOW.")
    public ResponseEntity<RandomStatementResponse> generate(
            @RequestParam(name = "loadProfile", required = false, defaultValue = "LOW") LoadProfile loadProfile) {
        log.info("Generating random statement data: profile={}", loadProfile);
        RandomStatementService.GenerationResult result = statementService.generate(loadProfile);
        return ResponseEntity.ok(new RandomStatementResponse(
                result.firstStatementId(),
                result.statementsGenerated(),
                result.transactionsGenerated(),
                result.accountsGenerated(),
                Instant.now()
        ));
    }
}
