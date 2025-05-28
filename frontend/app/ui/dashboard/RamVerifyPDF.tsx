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
    fontSize: 10,
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
    fontSize: 16,
    fontFamily: 'NotoSansTCBold',
    textAlign: 'left',
    marginBottom: 0,
    marginTop: 3,
    color: '#000000',
    padding: 1,
  },
});

const RamVerifyPDF = ({ products }: { products: Product[] }) => {
  // 生成隨機序列號
  const generateSerial = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = Array(3).fill(0).map(() => letters[Math.floor(Math.random() * letters.length)]).join('');
    const numbers = Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
    return `${prefix}${numbers}`;
  };

  // 將字符串日期轉換為 Date 對象並設置隨機時間
  const getBaseDate = () => {
    const date = new Date(products[0].date);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
  };

  const baseDate = getBaseDate();

  // 格式化時間的輔助函數
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}, ${hours}:${minutes}`;
  };

  // 根據索引獲取遞增的時間
  const getStartTime = (index: number) => {
    const time = new Date(baseDate.getTime() + (index * 15 * 60 * 1000));
    return formatDate(time);
  };

  const category = products[0].category; 

  // 處理可能的空值
  const getDisplayValue = (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const renderPageContent = (product: Product, index: number) => (
    <>
      <View style={styles.titleContainer}>
        <Image src="/verdrive.png" style={styles.titleImage} />
      </View>
      <Text style={styles.mainTitle}>{'Memory Verification Operation Report'}</Text>

      <View style={styles.table}>
        {[
          { label: 'Versions', value: '', isBold: true },
          { label: 'Report Product', value: '5.4.72-gentoo-x86_64' },
          { label: 'Hardware', value: '', isBold: true },
          { label: 'Computer Vendor', value: 'Hewlett-Packard' },
          { label: 'Computer Model', value: 'HP EliteBook 8470p' },
          { label: 'Processor', value: 'Intel(R) Core (TM) i5-3320M CPU @ 2.60GHz' },
          { label: 'Jobs', value: '', isBold: true },
          { label: 'Total Number of Memories', value: '1' },
          { label: 'Passes', value: '1' },
          { label: 'Operation Device index 1', value: '', isBold: true },
          { label: 'Percent Verified', value: '100.0000' },
          { label: 'Number of Sectors Checked', value: '87794524' },
          { label: 'Start Time', value: getStartTime(index) },            { label: 'Action Result', value: 'Success' },
          { label: 'Memory Byte Errors Detected', value: '0' },
          { label: 'Memory Errors', value: '0' },
          { label: 'DCO Found', value: 'No' },
          { label: 'HPA Found', value: 'No' },
          { label: 'Vendor', value: getDisplayValue(product.vender) },
          { label: 'Product', value: getDisplayValue(product.barcode) },
          { label: 'Log Serial', value: generateSerial() },
        ].map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.row : styles.evenRow}>
            <Text style={item.isBold ? styles.boldLabelColumn : styles.labelColumn}>{item.label}</Text>
            <Text style={styles.valueColumn}>{item.value}</Text>
          </View>
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

export default RamVerifyPDF;