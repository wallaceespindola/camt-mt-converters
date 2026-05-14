package com.wtechitsolutions.bankingconverter.conversion.strategy.velocity;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategy;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import com.wtechitsolutions.bankingconverter.template.VelocityRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Velocity-based strategy that generates a camt.053.001.08 (Bank-to-Customer Statement) XML.
 * camt.053 is the ISO 20022 end-of-day equivalent of MT940, including opening and closing balances.
 * Delegates rendering to {@link VelocityRenderer} using the {@code templates/camt053.vm} template.
 */
@Component
public class InternalToCamt053VelocityStrategy implements StatementExportStrategy {

    private static final Logger log = LoggerFactory.getLogger(InternalToCamt053VelocityStrategy.class);
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final VelocityRenderer velocityRenderer;

    public InternalToCamt053VelocityStrategy(VelocityRenderer velocityRenderer) {
        this.velocityRenderer = velocityRenderer;
    }

    @Override
    public ConversionTargetFormat targetFormat() {
        return ConversionTargetFormat.CAMT053;
    }

    @Override
    public ConversionEngine engine() {
        return ConversionEngine.VELOCITY;
    }

    @Override
    public GeneratedBankingFile export(BankStatement statement) {
        log.debug("Generating camt.053 via Velocity for statement={}", statement.statementReference());
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("statementRef", statement.statementReference());
        ctx.put("accountIban", statement.accountIban());
        ctx.put("currency", statement.accountCurrency());
        ctx.put("creationDateTime", LocalDateTime.now().format(DT));
        ctx.put("statementDate", statement.statementDate().format(DATE));
        ctx.put("openingBalance", statement.openingBalance().abs().toPlainString());
        ctx.put("closingBalance", statement.closingBalance().abs().toPlainString());
        ctx.put("transactions", buildTxMaps(statement.transactions(), statement.accountCurrency()));

        String content = velocityRenderer.render("templates/camt053.vm", ctx);
        return new GeneratedBankingFile(
                "statement-" + statement.id() + ".camt053.xml",
                "application/xml",
                content
        );
    }

    private List<Map<String, String>> buildTxMaps(List<BankTransaction> txns, String defaultCurrency) {
        List<Map<String, String>> result = new ArrayList<>();
        for (BankTransaction tx : txns) {
            Map<String, String> m = new HashMap<>();
            m.put("amount", tx.amount().abs().toPlainString());
            m.put("currency", tx.currency() != null ? tx.currency() : defaultCurrency);
            m.put("cdtDbtInd", DebitCreditIndicator.CREDIT.equals(tx.debitCreditIndicator()) ? "CRDT" : "DBIT");
            m.put("bookingDate", tx.bookingDate().format(DATE));
            m.put("valueDate", tx.valueDate().format(DATE));
            m.put("narrative", tx.remittanceInformation() != null ? tx.remittanceInformation() : "");
            result.add(m);
        }
        return result;
    }
}
