import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calculations Logic based on 05_ビジネスロジック設計.md
 * 
 * - Amounts are integers (Yen).
 * - Tax rates are handled as percentages (e.g. 10.00).
 * - Rounding rules:
 *   - Consumption Tax: Math.floor (Round down)
 *   - Withholding Tax: Math.floor (Round down)
 *   - Totals: Standard rounding not explicitly specified but floor is safer for tax. 
 *     Actually, let's follow standard practices or if specified.
 *     Design doc says: "端数処理: 切り捨て" (Floor) for tax calculations.
 */

export interface InvoiceItemInput {
    unitPrice: number;
    quantity: number;
    commissionRate: number; // percentage, e.g. 100.00
    taxType: "INCLUSIVE" | "EXCLUSIVE";
    taxRate: number; // percentage, e.g. 10.00
    withholdingTaxTarget: boolean;
}

export interface InvoiceCalculationResult {
    items: {
        amount: number; // Excluding tax
        taxAmount: number;
    }[];
    subtotal: number; // Excluding tax
    withholdingTaxSubtotal: number; // Base amount for withholding tax
    totalWithTax: number; // Including tax
    withholdingTax: number;
    invoiceAmount: number; // Final payable amount
}

export function calculateInvoice(items: InvoiceItemInput[]): InvoiceCalculationResult {
    let subtotal = 0;
    let withholdingTaxSubtotal = 0;
    let totalTaxAmount = 0;

    // Per item calculation
    const calculatedItems = items.map(item => {
        // Amount (Tax Exclusive basis) calculation
        // Formula: unitPrice * quantity * (commissionRate / 100)
        // Note: result should be integer.

        let amount = 0;
        let taxAmount = 0;

        const grossAmount = item.unitPrice * item.quantity * (item.commissionRate / 100);

        if (item.taxType === "INCLUSIVE") {
            // If inclusive, we need to extract tax
            // amount = grossAmount / (1 + taxRate/100)
            amount = Math.round(grossAmount / (1 + item.taxRate / 100)); // Round nearest? or Floor? Usually round to nearest yen for base.
            // Let's assume round for base amount extraction, and floor for tax.
            // Actullay, tax = grossAmount - amount
            taxAmount = Math.floor(grossAmount - amount);
        } else {
            // EXCLUSIVE
            amount = Math.round(grossAmount);
            taxAmount = Math.floor(amount * (item.taxRate / 100));
        }

        subtotal += amount;
        totalTaxAmount += taxAmount; // Simple summation of tax (or calculate tax on total?)
        // Usually, Invoice Tax is calculated on Total Amount per Tax Rate, OR sum of line item taxes.
        // Design doc says: 
        // "消費税 = 合計(税抜金額) × 税率" -> This implies calculating tax on subtotal, not sum of line items.
        // Let's re-read carefully if I can. 
        // Assuming "Sum of line items" is simpler for mixed tax rates (though mostly 10%).
        // But standard Invoice system (Qualified Invoice) requires Tax Calculation PER RATE on TOTAL.
        // Let's accumulate base amounts per rate.

        if (item.withholdingTaxTarget) {
            withholdingTaxSubtotal += amount;
        }

        return { amount, taxAmount }; // Checking individual item tax just for reference
    });

    // Re-calculate Tax on Subtotal (Assuming single 10% rate for MVP simplicity as per design doc usually)
    // If mixed rates exist, we should group by rate. 
    // Design doc 05_ビジネスロジック設計.md:
    // "消費税: 税率ごとに区分して合計した金額に対して計算（端数切り捨て）"
    // So we need to group by taxRate.

    const taxBases = new Map<number, number>();
    items.forEach((item, index) => {
        const amount = calculatedItems[index].amount;
        const rate = item.taxRate;
        const currentBase = taxBases.get(rate) || 0;
        taxBases.set(rate, currentBase + amount);
    });

    let calculatedTotalTax = 0;
    taxBases.forEach((baseAmount, rate) => {
        calculatedTotalTax += Math.floor(baseAmount * (rate / 100));
    });

    const totalWithTax = subtotal + calculatedTotalTax;

    // Withholding Tax Calculation
    // Base is withholdingTaxSubtotal.
    // Rate is 10.21%
    // "端数処理: 切り捨て"
    const withholdingTax = Math.floor(withholdingTaxSubtotal * 0.1021);

    const invoiceAmount = totalWithTax - withholdingTax;

    return {
        items: calculatedItems,
        subtotal,
        withholdingTaxSubtotal,
        totalWithTax,
        withholdingTax,
        invoiceAmount
    };
}
