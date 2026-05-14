package com.wtechitsolutions.bankingconverter.conversion.strategy.prowide;

import com.wtechitsolutions.bankingconverter.conversion.ConversionEngine;
import com.wtechitsolutions.bankingconverter.conversion.ConversionTargetFormat;
import com.wtechitsolutions.bankingconverter.conversion.GeneratedBankingFile;
import com.wtechitsolutions.bankingconverter.conversion.StatementExportStrategy;
import com.wtechitsolutions.bankingconverter.domain.BankStatement;
import com.wtechitsolutions.bankingconverter.domain.BankTransaction;
import com.wtechitsolutions.bankingconverter.domain.DebitCreditIndicator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Strategy that generates a camt.052.001.08 (Bank-to-Customer Account Report) XML document.
 * camt.052 is the ISO 20022 equivalent of MT942 — an intraday/interim account report.
 * XML construction is performed via direct string building to avoid an external JAXB schema dependency.
 */
@Component
public class InternalToCamt052ProwideStrategy implements StatementExportStrategy {

    private static final Logger log = LoggerFactory.getLogger(InternalToCamt052ProwideStrategy.class);
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public ConversionTargetFormat targetFormat() {
        return ConversionTargetFormat.CAMT052;
    }

    @Override
    public ConversionEngine engine() {
        return ConversionEngine.PROWIDE;
    }

    @Override
    public GeneratedBankingFile export(BankStatement statement) {
        log.debug("Generating camt.052 via Prowide for statement={}", statement.statementReference());
        String xml = buildXml(statement);
        return new GeneratedBankingFile(
                "statement-" + statement.id() + ".camt052.xml",
                "application/xml",
                xml
        );
    }

    private String buildXml(BankStatement s) {
        String now = LocalDateTime.now().format(DT);
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:camt.052.001.08\">\n");
        sb.append("  <BkToCstmrAcctRpt>\n");
        sb.append("    <GrpHdr>\n");
        sb.append("      <MsgId>").append(escape(s.statementReference())).append("</MsgId>\n");
        sb.append("      <CreDtTm>").append(now).append("</CreDtTm>\n");
        sb.append("    </GrpHdr>\n");
        sb.append("    <Rpt>\n");
        sb.append("      <Id>").append(escape(s.statementReference())).append("</Id>\n");
        sb.append("      <CreDtTm>").append(now).append("</CreDtTm>\n");
        sb.append("      <Acct>\n");
        sb.append("        <Id><IBAN>").append(escape(s.accountIban())).append("</IBAN></Id>\n");
        sb.append("        <Ccy>").append(escape(s.accountCurrency())).append("</Ccy>\n");
        sb.append("      </Acct>\n");
        for (BankTransaction tx : s.transactions()) {
            sb.append(buildEntryXml(tx));
        }
        sb.append("    </Rpt>\n");
        sb.append("  </BkToCstmrAcctRpt>\n");
        sb.append("</Document>");
        return sb.toString();
    }

    private String buildEntryXml(BankTransaction tx) {
        String dcInd = DebitCreditIndicator.CREDIT.equals(tx.debitCreditIndicator()) ? "CRDT" : "DBIT";
        StringBuilder sb = new StringBuilder();
        sb.append("      <Ntry>\n");
        sb.append("        <Amt Ccy=\"").append(escape(tx.currency())).append("\">")
                .append(tx.amount().abs().toPlainString()).append("</Amt>\n");
        sb.append("        <CdtDbtInd>").append(dcInd).append("</CdtDbtInd>\n");
        sb.append("        <Sts><Cd>BOOK</Cd></Sts>\n");
        sb.append("        <BookgDt><Dt>").append(tx.bookingDate().format(DATE)).append("</Dt></BookgDt>\n");
        sb.append("        <ValDt><Dt>").append(tx.valueDate().format(DATE)).append("</Dt></ValDt>\n");
        if (tx.remittanceInformation() != null) {
            sb.append("        <NtryDtls><TxDtls><RmtInf><Ustrd>")
                    .append(escape(tx.remittanceInformation()))
                    .append("</Ustrd></RmtInf></TxDtls></NtryDtls>\n");
        }
        sb.append("      </Ntry>\n");
        return sb.toString();
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
