package com.wtechitsolutions.bankingconverter.conversion.strategy.prowide;

import com.prowidesoftware.swift.model.field.Field20;
import com.prowidesoftware.swift.model.field.Field25;
import com.prowidesoftware.swift.model.field.Field28C;
import com.prowidesoftware.swift.model.field.Field61;
import com.prowidesoftware.swift.model.field.Field86;
import com.prowidesoftware.swift.model.mt.mt9xx.MT942;
import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategy;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Prowide-based strategy that generates MT942 (intraday/interim account statement).
 * MT942 does not carry opening or closing balance fields (Field60F/Field62F) — it is
 * an intraday report that lists only the transactions since the last statement.
 */
@Component
public class InternalToMt942ProwideStrategy extends AbstractMtProwideStrategy
        implements StatementExportStrategy {

    private static final Logger log = LoggerFactory.getLogger(InternalToMt942ProwideStrategy.class);

    @Override
    public ConversionTargetFormat targetFormat() {
        return ConversionTargetFormat.MT942;
    }

    @Override
    public ConversionEngine engine() {
        return ConversionEngine.PROWIDE;
    }

    @Override
    public GeneratedBankingFile export(BankStatement statement) {
        log.debug("Generating MT942 via Prowide for statement={}", statement.statementReference());
        MT942 mt942 = new MT942();

        mt942.addField(new Field20(truncate(statement.statementReference(), 16)));
        mt942.addField(new Field25(statement.accountIban()));
        mt942.addField(new Field28C("00001/001"));

        for (BankTransaction tx : statement.transactions()) {
            mt942.addField(new Field61(formatField61(tx)));
            mt942.addField(new Field86(formatField86(tx)));
        }

        String content = mt942.message();
        return new GeneratedBankingFile(
                "statement-" + statement.id() + ".mt942",
                "text/plain",
                content
        );
    }
}
