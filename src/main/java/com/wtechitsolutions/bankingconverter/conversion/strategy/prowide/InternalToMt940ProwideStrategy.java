package com.wtechitsolutions.bankingconverter.conversion.strategy.prowide;

import com.prowidesoftware.swift.model.field.Field20;
import com.prowidesoftware.swift.model.field.Field25;
import com.prowidesoftware.swift.model.field.Field28C;
import com.prowidesoftware.swift.model.field.Field60F;
import com.prowidesoftware.swift.model.field.Field61;
import com.prowidesoftware.swift.model.field.Field62F;
import com.prowidesoftware.swift.model.field.Field86;
import com.prowidesoftware.swift.model.mt.mt9xx.MT940;
import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategy;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class InternalToMt940ProwideStrategy extends AbstractMtProwideStrategy
        implements StatementExportStrategy {

    private static final Logger log = LoggerFactory.getLogger(InternalToMt940ProwideStrategy.class);

    @Override
    public ConversionTargetFormat targetFormat() {
        return ConversionTargetFormat.MT940;
    }

    @Override
    public ConversionEngine engine() {
        return ConversionEngine.PROWIDE;
    }

    @Override
    public GeneratedBankingFile export(BankStatement statement) {
        log.debug("Generating MT940 via Prowide for statement={}", statement.statementReference());
        MT940 mt940 = new MT940();

        mt940.addField(new Field20(truncate(statement.statementReference(), 16)));
        mt940.addField(new Field25(statement.accountIban()));
        mt940.addField(new Field28C("00001/001"));
        mt940.addField(new Field60F(
                formatBalanceLine(statement, statement.openingBalance(), statement.statementDate(), true)));

        for (BankTransaction tx : statement.transactions()) {
            mt940.addField(new Field61(formatField61(tx)));
            mt940.addField(new Field86(formatField86(tx)));
        }

        mt940.addField(new Field62F(
                formatBalanceLine(statement, statement.closingBalance(), statement.statementDate(), true)));

        String content = mt940.message();
        return new GeneratedBankingFile(
                "statement-" + statement.id() + ".mt940",
                "text/plain",
                content
        );
    }
}
