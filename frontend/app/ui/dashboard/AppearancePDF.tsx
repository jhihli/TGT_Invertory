import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Product } from '@/interface/IDatatable';
import React from 'react';

// 註冊中文字體，與 TicketPDF 使用相同的字體設定
Font.register({
  family: 'NotoSansTC',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tc@4.5.12/files/noto-sans-tc-all-400-normal.woff',
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'NotoSansTC',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: 'white',
    color: 'black',
  },
  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4,
    fontSize: 8,
    textAlign: 'center',
    fontFamily: 'NotoSansTC',
  },
  headerCell: {
    backgroundColor: 'white',
    color: 'black',
    fontWeight: 'bold',
  },
  doubleHeaderCell: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    color: 'black',
    fontWeight: 'bold',
    padding: 0,
    fontSize: 8,
    fontFamily: 'NotoSansTC',
    height: 32, // 設定固定高度
  },
  upperText: {
    borderBottom: '1px solid black',
    height: '50%',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowerText: {
    borderBottom: '1px solid black',
    height: '50%',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 為不同列寬定義不同的樣式
  cellNO: { width: '5%' },
  cellDate: { width: '7%' },
  cellBrand: { width: '16%' },
  cellDesc: { width: '8%' },
  cellStatus: { width: '8%' },
  cellDents: { width: '8%' },
  cellColor: { 
    width: '6%', 
    borderRight: '1px solid black',
  },
  cellCategory: { width: '4%' },
  cellCPU: { width: '6%' },
  cellMemory: { width: '6%' },
  cellDataClear: { width: '8%' },
  cellF: { width: '4%' },
  cellSafety: { width: '7%' },
  cellTester: { width: '7%' },
  titleContainer: {
    marginBottom: 10,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end', // 將容器內容靠右對齊
  },
  titleImage: {
    width: '60%',
    height: 'auto',
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: 0,
    marginTop: 3,
    fontFamily: 'NotoSansTC', // 確保使用中文字體
    color: '#000000',
    padding: 5,
    letterSpacing: 1, // 添加字間距以改善中文顯示
  },
  spanningHeaderCell: {
    backgroundColor: '#90EE90', // Match the green from your image
    color: 'black',
    fontWeight: 'bold',
    fontSize: 8,
    padding: 4,
    textAlign: 'center',
    fontFamily: 'NotoSansTC',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1, // Remove bottom border
  },
  firstHeaderCell: {
    borderBottomWidth: 0, // Remove bottom border for the first header row
  },
});

const AppearancePDF = ({ products }: { products: Product[] }) => {

  const category = products[0].category; 

  // 處理可能的空值
  const getDisplayValue = (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const columns = [
    { header: 'NO.', key: 'id', style: styles.cellNO },
    { header: '日期', key: 'date', style: styles.cellDate },
    { header: '型号', key: 'number', style: styles.cellBrand },
    { header: '類別描述', key: 'description', style: styles.cellDesc },
    { header: '標識情況', key: 'status', style: styles.cellStatus },
    { header: '凹痕和划痕', key: 'dents', style: styles.cellDents },
    { header: '變色', key: 'color', style: styles.cellColor },
    { header: 'C', key: 'category', style: styles.cellCategory },
    { header: 'CPU', key: 'cpu', style: styles.cellCPU },
    { header: '內存', key: 'memory', style: styles.cellMemory },
    { header: '數據清除', key: 'dataClear', style: styles.cellDataClear },
    { header: 'F', key: 'f', style: styles.cellF },
    { header: '安全性危害', key: 'safety', style: styles.cellSafety },
    { header: '測試人員', key: 'tester', style: styles.cellTester },
  ];

  // 計算每頁可以顯示的行數
  const ROWS_PER_PAGE = 17; // 調整這個數字以適應標題後的可用空間

  // 將產品數據分成多頁
  const totalPages = Math.ceil(products.length / ROWS_PER_PAGE);
  const getPageProducts = (pageIndex: number) => {
    const start = pageIndex * ROWS_PER_PAGE;
    return products.slice(start, start + ROWS_PER_PAGE);
  };

  const renderHeaderCell = (column: any, index: number) => {
    return (
      <Text key={index} style={[styles.tableCell, column.style, styles.headerCell]}>
        {getDisplayValue(column.header)}
      </Text>
    );
  };

  const renderPageContent = (pageProducts: Product[]) => (
    <>
      <View style={styles.titleContainer}>
        <Image src="/exceltitle.png" style={styles.titleImage} />
      </View>
      <Text style={styles.mainTitle}>{'外觀，功能測試及數據清除表'}</Text>
      <View style={styles.table}>
        {/* First Header Row: "外觀分類" spanning appearance columns */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          {/* Empty cells for non-appearance columns before */}
          <Text style={[styles.tableCell, styles.headerCell, styles.cellNO, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellDate, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellBrand, styles.firstHeaderCell]}></Text>
          {/* Spanning "外觀分類" */}
          <Text
            style={[
              styles.spanningHeaderCell,
              { width: '30%' }, // 8% + 8% + 8% + 6% = 30%
            ]}
          >
            外觀分類
          </Text>
          <Text
            style={[
              styles.spanningHeaderCell,
              { width: '4%' }, 
            ]}
          >
            類
          </Text>
          <Text
            style={[
              styles.spanningHeaderCell,
              { width: '20%' }, 
            ]}
          >
            功能測試
          </Text>
          <Text
            style={[
              styles.spanningHeaderCell,
              { width: '4%' }, 
            ]}
          >
            類
          </Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellSafety, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellTester, styles.firstHeaderCell]}></Text>
        </View>

        {/* Second Header Row: Individual Column Headers */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          {columns.map((column, i) => renderHeaderCell(column, i))}
        </View>

        {/* 數據行 */}
        {pageProducts.map((product, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.cellNO]}>{getDisplayValue(product.id)}</Text>
            <Text style={[styles.tableCell, styles.cellDate]}>{getDisplayValue(product.date)}</Text>
            <Text style={[styles.tableCell, styles.cellBrand]}>{getDisplayValue(product.barcode)}</Text>
            <Text style={[styles.tableCell, styles.cellDesc]}>{''}</Text>
            <Text style={[styles.tableCell, styles.cellStatus]}>{'Good'}</Text>
            <Text style={[styles.tableCell, styles.cellDents]}>{'X'}</Text>
            <Text style={[styles.tableCell, styles.cellColor]}>{'X'}</Text>
            <Text style={[styles.tableCell, styles.cellCategory]}>{'C5'}</Text>
            <Text style={[styles.tableCell, styles.cellCPU]}>{'n/a'}</Text>
            <Text style={[styles.tableCell, styles.cellMemory]}>{category === '2' ? 'V' : ''}</Text>
            <Text style={[styles.tableCell, styles.cellDataClear]}>{category === '1' ? 'V' : ''}</Text>
            <Text style={[styles.tableCell, styles.cellF]}>{'F4'}</Text>
            <Text style={[styles.tableCell, styles.cellSafety]}>{'X'}</Text>
            <Text style={[styles.tableCell, styles.cellTester]}>{'John'}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <Document>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <Page 
          key={pageIndex} 
          size="A4" 
          orientation="landscape" 
          style={styles.page}
        >
          {renderPageContent(getPageProducts(pageIndex))}
        </Page>
      ))}
    </Document>
  );
};

export default AppearancePDF;