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

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Velocity-based strategy that generates MT942 (intraday/interim account report).
 * MT942 does not include opening or closing balance fields. Delegates rendering to
 * {@link VelocityRenderer} using the {@code templates/mt942.vm} template.
 */
@Component
public class InternalToMt942VelocityStrategy implements StatementExportStrategy {

    private static final Logger log = LoggerFactory.getLogger(InternalToMt942VelocityStrategy.class);
    private static final DateTimeFormatter SWIFT_DATE = DateTimeFormatter.ofPattern("yyMMdd");

    private final VelocityRenderer velocityRenderer;

    public InternalToMt942VelocityStrategy(VelocityRenderer velocityRenderer) {
        this.velocityRenderer = velocityRenderer;
    }

    @Override
    public ConversionTargetFormat targetFormat() {
        return ConversionTargetFormat.MT942;
    }

    @Override
    public ConversionEngine engine() {
        return ConversionEngine.VELOCITY;
    }

    @Override
    public GeneratedBankingFile export(BankStatement statement) {
        log.debug("Generating MT942 via Velocity for statement={}", statement.statementReference());
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("statementRef", truncate(statement.statementReference(), 16));
        ctx.put("accountIban", statement.accountIban());
        ctx.put("transactions", buildTxMaps(statement.transactions()));

        String content = velocityRenderer.render("templates/mt942.vm", ctx);
        return new GeneratedBankingFile(
                "statement-" + statement.id() + ".mt942",
                "text/plain",
                content
        );
    }

    private List<Map<String, String>> buildTxMaps(List<BankTransaction> txns) {
        List<Map<String, String>> result = new ArrayList<>();
        for (BankTransaction tx : txns) {
            Map<String, String> m = new HashMap<>();
            String dc = DebitCreditIndicator.CREDIT.equals(tx.debitCreditIndicator()) ? "C" : "D";
            String ref = truncate(tx.transactionReference() != null ? tx.transactionReference() : "NONREF", 16);
            m.put("field61", tx.valueDate().format(SWIFT_DATE) + dc + formatAmount(tx.amount()) + "NMSC" + ref);
            m.put("narrative",
                    truncate(tx.remittanceInformation() != null ? tx.remittanceInformation() : "", 65));
            result.add(m);
        }
        return result;
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0,";
        BigDecimal abs = amount.abs();
        long intPart = abs.longValue();
        int fracPart = abs.subtract(BigDecimal.valueOf(intPart)).multiply(BigDecimal.valueOf(100)).intValue();
        return intPart + "," + String.format("%02d", Math.abs(fracPart));
    }

    private String truncate(String v, int max) {
        return v != null && v.length() > max ? v.substring(0, max) : (v != null ? v : "");
    }
}
