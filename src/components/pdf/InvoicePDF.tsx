import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register Japanese Font
// Note: This URL might change. Ideally download and serve locally from public/fonts.
Font.register({
    family: 'NotoSansJP',
    src: 'https://fonts.gstatic.com/s/notosansjp/v52/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8_1vQt9LM0.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'NotoSansJP',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    invoiceInfo: {
        textAlign: 'right',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    companyInfo: {
        width: '45%',
    },
    freelancerInfo: {
        width: '45%',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        backgroundColor: '#eee',
        padding: 4,
    },
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
    },
    colNo: { width: '5%', textAlign: 'center' },
    colItem: { width: '45%', paddingLeft: 4 },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right', paddingRight: 4 },
    colAmount: { width: '25%', textAlign: 'right', paddingRight: 4 },

    totals: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    totalRow: {
        flexDirection: 'row',
        width: '50%',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    grandTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        borderTopWidth: 2,
        borderTopColor: '#333',
        paddingTop: 4,
        marginTop: 4,
    },
    bankInfo: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
    },
    notes: {
        marginTop: 20,
        fontSize: 9,
        color: '#666',
    },
});

interface InvoicePDFProps {
    invoice: any; // Using any for simplicity, ideally structured type
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy年MM月dd日');
};

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => {
    // Parse Snapshots
    let freelancer = invoice.freelancer;
    let company = { companyName: '自社名未設定', postalCode: '', address: '', phone: '', email: '' }; // Default

    if (invoice.freelancerSnapshot) {
        try { freelancer = JSON.parse(invoice.freelancerSnapshot); } catch (e) { }
    }
    if (invoice.companySnapshot) {
        try { company = JSON.parse(invoice.companySnapshot); } catch (e) { }
    } else if (invoice.companySnapshot === null) {
        // If draft and viewing PDF, might not have snapshot. Fallback to current relations?
        // Assuming context passed invoice has include relations if snapshot missing.
        // But typically PDF is generated after confirmation.
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>請求書</Text>
                    <View style={styles.invoiceInfo}>
                        <Text>請求書番号: {invoice.invoiceNumber || '未確定'}</Text>
                        <Text>発行日: {formatDate(invoice.confirmedAt || new Date())}</Text>
                        <Text>請求日: {formatDate(invoice.billingDate)}</Text>
                        <Text>支払期限: {formatDate(invoice.paymentDueDate)}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    {/* Company (Payer) - Actually, invoice is FROM Freelancer TO Company usually?
             Wait, "Smart Order Management" usually means Company issues order, Freelancer issues Invoice.
             So Header should be "To: Company", "From: Freelancer".
             Let's check design doc. 
             "支払元 = Company", "お支払先 = Freelancer"
             So User (Company) receives Invoice from Freelancer.
             However, System generates Invoice "on behalf of Freelancer".
             So PDF Sender is Freelancer, Receiver is Company.
          */}
                    <View style={styles.companyInfo}>
                        <Text style={styles.sectionTitle}>請求先（支払元）</Text>
                        <Text>{company.companyName} 御中</Text>
                        <Text>〒{company.postalCode}</Text>
                        <Text>{company.address}</Text>
                        <Text>{company.phone}</Text>
                    </View>

                    <View style={styles.freelancerInfo}>
                        <Text style={styles.sectionTitle}>請求者（発行元）</Text>
                        <Text>{freelancer.name}</Text>
                        <Text>〒{freelancer.postalCode}</Text>
                        <Text>{freelancer.address}</Text>
                        <Text>{freelancer.phone}</Text>
                        {freelancer.invoiceNumber && <Text>登録番号: {freelancer.invoiceNumber}</Text>}
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.colNo}>No.</Text>
                        <Text style={styles.colItem}>品目</Text>
                        <Text style={styles.colQty}>数量</Text>
                        <Text style={styles.colPrice}>単価</Text>
                        <Text style={styles.colAmount}>金額</Text>
                    </View>
                    {invoice.items.map((item: any, index: number) => (
                        <View key={item.id} style={styles.tableRow}>
                            <Text style={styles.colNo}>{index + 1}</Text>
                            <Text style={styles.colItem}>{item.productName}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>{Number(item.unitPrice).toLocaleString()}</Text>
                            <Text style={styles.colAmount}>{Number(item.amount).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={{ width: '60%' }}>
                        {/* Empty left side */}
                    </View>
                    <View style={{ width: '40%' }}>
                        <View style={styles.totalRow}>
                            <Text>小計 (税抜)</Text>
                            <Text>{formatCurrency(Number(invoice.subtotal))}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text>消費税</Text>
                            {/* Simplified tax display. Usually broken down by rate */}
                            <Text>{formatCurrency(Number(invoice.totalWithTax) - Number(invoice.subtotal))}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text>合計 (税込)</Text>
                            <Text>{formatCurrency(Number(invoice.totalWithTax))}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text>源泉徴収税額</Text>
                            <Text>- {formatCurrency(Number(invoice.withholdingTax))}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotal]}>
                            <Text>ご請求金額</Text>
                            <Text>{formatCurrency(Number(invoice.invoiceAmount))}</Text>
                        </View>
                    </View>
                </View>

                {/* Bank Info */}
                <View style={styles.bankInfo}>
                    <Text style={[styles.sectionTitle, { backgroundColor: '#fff', marginBottom: 5 }]}>お振込先</Text>
                    <Text>銀行名: {freelancer.bankName}</Text>
                    <Text>支店名: {freelancer.bankBranch}</Text>
                    <Text>口座種別: {freelancer.accountType === 'ORDINARY' ? '普通' : (freelancer.accountType === 'CURRENT' ? '当座' : '貯蓄')}</Text>
                    <Text>口座番号: {freelancer.accountNumber}</Text>
                    <Text>口座名義: {freelancer.accountHolder}</Text>
                </View>

                {/* Notes */}
                {invoice.notes && (
                    <View style={styles.notes}>
                        <Text style={{ fontWeight: 'bold' }}>備考:</Text>
                        <Text>{invoice.notes}</Text>
                    </View>
                )}

            </Page>
        </Document>
    );
};
