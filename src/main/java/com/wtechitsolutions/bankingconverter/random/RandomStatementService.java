package com.wtechitsolutions.bankingconverter.random;

import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import com.wtechitsolutions.bankingconverter.domain.LoadProfile;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankStatementEntity;
import com.wtechitsolutions.bankingconverter.persistence.entity.BankTransactionEntity;
import com.wtechitsolutions.bankingconverter.persistence.repository.BankStatementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Generates random {@link BankStatementEntity} and {@link BankTransactionEntity} objects
 * and persists them, driven by a {@link LoadProfile}.
 */
@Service
public class RandomStatementService {

    private static final Logger log = LoggerFactory.getLogger(RandomStatementService.class);

    private static final String[] CURRENCIES  = {"EUR", "USD", "GBP"};
    private static final String[] BANK_CODES  = {"10", "20", "30", "40", "50"};
    private static final AtomicLong SEQ_COUNTER = new AtomicLong(1);

    private final BankStatementRepository statementRepository;

    public RandomStatementService(BankStatementRepository statementRepository) {
        this.statementRepository = statementRepository;
    }

    /**
     * Generates and persists bank statements according to the given {@code profile}.
     *
     * @param profile controls the number of accounts, statements and transactions per statement
     * @return a summary of what was generated
     */
    @Transactional
    public GenerationResult generate(LoadProfile profile) {
        log.info("Generating random data: profile={}", profile);
        List<String> ibanPool = generateIbanPool(profile.accountCount());
        List<BankStatementEntity> saved = new ArrayList<>();

        for (int i = 0; i < profile.statementCount(); i++) {
            String iban = ibanPool.get(i);
            BankStatementEntity stmt = generateStatement(i, iban);
            List<BankTransactionEntity> txns = generateTransactions(stmt, profile.transactionsPerStatement());
            txns.forEach(t -> t.setStatement(stmt));
            stmt.getTransactions().addAll(txns);
            saved.add(statementRepository.save(stmt));
        }

        int totalTxns = saved.stream().mapToInt(s -> s.getTransactions().size()).sum();
        log.info("Generated {} statements, {} transactions ({} accounts in pool)",
                saved.size(), totalTxns, profile.accountCount());
        return new GenerationResult(
                saved.isEmpty() ? null : saved.get(0).getId(),
                saved.size(),
                totalTxns,
                profile.accountCount());
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private List<String> generateIbanPool(int count) {
        List<String> pool = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            pool.add(generateIban());
        }
        return pool;
    }

    private BankStatementEntity generateStatement(int index, String iban) {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        String currency = CURRENCIES[rnd.nextInt(CURRENCIES.length)];
        BigDecimal openingBalance = BigDecimal.valueOf(rnd.nextLong(5_000, 100_000));
        BigDecimal closingBalance = openingBalance.add(BigDecimal.valueOf(rnd.nextLong(-2_000, 5_000)));

        return BankStatementEntity.builder()
                .statementReference("STMT-" + LocalDate.now() + "-" + String.format("%03d", SEQ_COUNTER.getAndIncrement()))
                .accountIban(iban)
                .accountCurrency(currency)
                .statementDate(LocalDate.now().minusDays(index))
                .openingBalance(openingBalance)
                .closingBalance(closingBalance)
                .transactions(new ArrayList<>())
                .build();
    }

    private List<BankTransactionEntity> generateTransactions(BankStatementEntity stmt, int count) {
        List<BankTransactionEntity> list = new ArrayList<>();
        ThreadLocalRandom rnd = ThreadLocalRandom.current();

        for (int i = 0; i < count; i++) {
            boolean isCredit = rnd.nextBoolean();
            list.add(BankTransactionEntity.builder()
                    .bookingDate(stmt.getStatementDate().minusDays(i))
                    .valueDate(stmt.getStatementDate().minusDays(i))
                    .amount(BigDecimal.valueOf(rnd.nextLong(10, 5_000)))
                    .currency(stmt.getAccountCurrency())
                    .debitCreditIndicator(isCredit ? DebitCreditIndicator.CREDIT : DebitCreditIndicator.DEBIT)
                    .transactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .counterpartyName("Counterparty " + (i + 1))
                    .remittanceInformation("Payment ref " + (i + 1) + " for account " + stmt.getAccountIban())
                    .bankTransactionCode("PMNT")
                    .build());
        }
        return list;
    }

    private String generateIban() {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        String bankCode = BANK_CODES[rnd.nextInt(BANK_CODES.length)];
        return "DE" + String.format("%02d", rnd.nextInt(10, 99))
                + bankCode + String.format("%016d", rnd.nextLong(1_000_000_000_000_000L));
    }

    // -------------------------------------------------------------------------
    // Result record
    // -------------------------------------------------------------------------

    /**
     * Immutable summary of a single generation run.
     *
     * @param firstStatementId      the database ID of the first persisted statement, or {@code null} if none
     * @param statementsGenerated   total number of statements created
     * @param transactionsGenerated total number of transactions created across all statements
     * @param accountsGenerated     size of the account (IBAN) pool used for this run
     */
    public record GenerationResult(
            Long firstStatementId,
            int statementsGenerated,
            int transactionsGenerated,
            int accountsGenerated
    ) {}
}
