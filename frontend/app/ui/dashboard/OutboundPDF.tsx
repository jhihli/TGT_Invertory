import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Product } from '@/interface/IDatatable';
import React from 'react';
import JsBarcode from 'jsbarcode';

// 註冊中文字體
Font.register({
  family: 'NotoSansTC',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tc@4.5.12/files/noto-sans-tc-all-400-normal.woff',
});

// Add formatDate utility function
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontFamily: 'NotoSansTC',
  },
  headerTable: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    borderBottomStyle: 'solid',
  },
  mainTitleContainer: {
    width: '100%',
    backgroundColor: 'white',
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  clientInfoRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  clientInfoCell: {
    flex: 1,
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeaderCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
  },
  numberCell: { flex: 0.5 },
  nameCell: { flex: 3.5 },
  unitCell: { flex: 0.5 },
  qtyCell: { flex: 0.5 },
  priceCell: { flex: 0.5 },
  amountCell: { flex: 1 },
  noteCell: { flex: 1 },
  footerRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
  },
  signaturesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 10,
  },
  signatureCell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  footerCell: {
    padding: 5,
    fontSize: 10,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
  }
});

interface TicketPDFProps {
  products: Product[];
}

const ITEMS_PER_PAGE = 20;


const OutboundPDF = ({ products }: TicketPDFProps) => {
  const groupedByDate = products.reduce((acc, product) => {
    const date = product.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const renderTableProducts = (products: Product[], startIndex: number, endIndex: number) => {
    return (
      <View style={styles.table}>
        {products.slice(startIndex, endIndex).map((product, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.numberCell]}>
              {startIndex + index + 1}
            </Text>
            <Text style={[styles.tableCell, styles.nameCell]}>
              {product.barcode || ''}
            </Text>
            <Text style={[styles.tableCell, styles.unitCell]}>
              {''}
            </Text>
            <Text style={[styles.tableCell, styles.qtyCell]}>
              {product.qty || ''}
            </Text>
            <Text style={[styles.tableCell, styles.priceCell]}>
              {''}
            </Text>
            <Text style={[styles.tableCell, styles.amountCell]}>
              {''}
            </Text>
            <Text style={[styles.tableCell, styles.noteCell]}>
              {''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = ({ date, products }: { date: string; products: Product[] }) => (
    <View style={styles.headerTable}>
      <View style={styles.mainTitleContainer}>
        <Text style={styles.mainTitle}>商品出庫單</Text>
      </View>
      <View style={styles.clientInfoRow}>
        <Text style={styles.clientInfoCell}>客戶名稱</Text>
        <Text style={styles.clientInfoCell}>{products[0]?.client || ''}</Text>
        <Text style={styles.clientInfoCell}>客戶編碼</Text>
        <Text style={styles.clientInfoCell}>{}</Text>
        <Text style={styles.clientInfoCell}>日期</Text>
        <Text style={styles.clientInfoCell}>{date}</Text>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.numberCell]}>編号</Text>
        <Text style={[styles.tableHeaderCell, styles.nameCell]}>名稱</Text>
        <Text style={[styles.tableHeaderCell, styles.unitCell]}>單位</Text>
        <Text style={[styles.tableHeaderCell, styles.qtyCell]}>數量</Text>
        <Text style={[styles.tableHeaderCell, styles.priceCell]}>單價</Text>
        <Text style={[styles.tableHeaderCell, styles.amountCell]}>金額</Text>
        <Text style={[styles.tableHeaderCell, styles.noteCell]}>備註</Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerRow}>
      <Text style={[styles.footerCell, { flex: 2 }]}>總合計大寫:</Text>
      <Text style={styles.footerCell}>合計:</Text>
      <Text style={styles.signatureCell}>主管:</Text>
      <Text style={styles.signatureCell}>財務:</Text>
      <Text style={styles.signatureCell}>保管員:</Text>
      <Text style={styles.signatureCell}>經手人:</Text>
    </View>
  );

  return (
    <Document>
      {Object.entries(groupedByDate).map(([date, dateProducts]) => {
        const totalPages = Math.ceil(dateProducts.length / ITEMS_PER_PAGE);
        
        return Array.from({ length: totalPages }).map((_, pageIndex) => {
          const startIndex = pageIndex * ITEMS_PER_PAGE;
          const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, dateProducts.length);
          
          return (
            <Page key={`${date}-${pageIndex}`} size="A4" style={styles.page}>
              {renderHeader({ date, products: dateProducts })}
              {renderTableProducts(dateProducts, startIndex, endIndex)}
              {renderFooter()}
              <Text style={styles.pageNumber}>
                Page {pageIndex + 1} of {totalPages}
              </Text>
            </Page>
          );
        });
      })}
    </Document>
  );
};

export default OutboundPDF;
