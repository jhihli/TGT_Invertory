import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Product } from '@/interface/IDatatable';
import React from 'react';

// 註冊中文字體，與 TicketPDF 使用相同的字體設定
Font.register({
  family: 'NotoSansTC',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tc@4.5.12/files/noto-sans-tc-all-400-normal.woff',
});

Font.register({
  family: 'NotoSansTCBold',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tc@4.5.12/files/noto-sans-tc-all-700-normal.woff',
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'NotoSansTC',
  },
  table: {
    display: 'flex',
    width: '100%',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  evenRow: {
    flexDirection: 'row',
    marginBottom: 1,
    backgroundColor: '#FFFFE0', // 淺黃色背景
  },
  labelColumn: {
    width: '30%',
    fontSize: 10,
    fontWeight: 'bold',
  },
  valueColumn: {
    width: '70%',
    fontSize: 10,
  },
  boldValueColumn: {
    width: '70%',
    fontSize: 10,
    fontFamily: 'NotoSansTCBold',
  },
  boldLabelColumn: {
    width: '30%',
    fontSize: 16,
    fontFamily: 'NotoSansTCBold',
  },
  titleContainer: {
    marginBottom: 5,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
  },
  titleImage: {
    width: '60%',
    height: 'auto',
  },
  mainTitle: {
    fontSize: 48,
    fontFamily: 'NotoSansTCBold',
    textAlign: 'left',
    marginBottom: 0,
    marginTop: 3,
    color: '#000000',
    padding: 1,
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginVertical: 5,
    width: '100%',
    marginBottom: 20,
  },
});

const RamDiagnosticPDF = ({ products }: { products: Product[] }) => {
  // 生成隨機序列號
  const generateSerial = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = Array(3).fill(0).map(() => letters[Math.floor(Math.random() * letters.length)]).join('');
    const numbers = Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    return `${prefix}${numbers}`;
  };

  const generateDuration = () => {
    const minutes = Math.floor(Math.random() * (50 - 20 + 1)) + 20; // 20-50分鐘
    const seconds = Math.floor(Math.random() * 60);
    return `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 處理可能的空值
  const getDisplayValue = (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const renderPageContent = (product: Product, index: number) => (
    <>
      <View style={styles.titleContainer}>
        <Image src="/detalys_title.png" style={styles.titleImage} />
      </View>
      

      <View style={styles.table}>
        {[
          { label: 'Operation Info', value: '', isBold: true },
          { label: 'Action Result', value: 'Success' },
          { label: 'Software Used', value: 'Detalys 1.1' },
          { label: 'Kernel Version', value: '5.4.72-gentoo-x86_64' },
          { label: 'Start Time', value: getDisplayValue(product.date) },   
          { label: 'Duration', value: generateDuration() },   
          { separator: true },
          { label: 'Hardware Test Overview', value: '', isBold: true },
          { label: 'RAM', value: 'Success' },
          { separator: true },
          { label: 'Hardware Information', value: '', isBold: true },
          { label: 'Vendor', value: getDisplayValue(product.vender) },
          { label: 'Product Type', value: getDisplayValue(product.barcode) },
          { label: 'Log Serial', value: generateSerial() },
        ].map((item, index) => (
          item.separator ? (
            <View key={`sep-${index}`} style={styles.separator} />
          ) : (
            <View key={index} style={index % 2 === 0 ? styles.row : styles.evenRow}>
              <Text style={item.isBold ? styles.boldLabelColumn : styles.labelColumn}>{item.label}</Text>
              <Text style={styles.valueColumn}>{item.value}</Text>
            </View>
          )
        ))}
      </View>
    </>
  );

  return (
    <Document>
      {products.map((product, index) => (
        <Page 
          key={index} 
          size="A4" 
          orientation="landscape" 
          style={styles.page}
        >
          {renderPageContent(product, index)}
        </Page>
      ))}
    </Document>
  );
};

export default RamDiagnosticPDF;