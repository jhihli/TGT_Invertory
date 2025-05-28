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
  cellNO: { width: '8%' },
  cellDate: { width: '10%' },
  cellBrand: { width: '20%' },
  cellF: { width: '6%' },
  cellC: { 
    width: '6%', 
    borderRight: '1px solid black',
  },
  cellStatus: { width: '10%' },
  cellQualified: { width: '10%' },
  cellunQualified: { width: '15%' },
  cellSafety: { width: '10%' },
  cellTester: { width: '5%' },
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
    padding: 3,
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

const RepairPDF = ({ products }: { products: Product[] }) => {

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
    { header: '外觀分類', key: 'C', style: styles.cellC },
    { header: '功能分類', key: 'F', style: styles.cellF },
    { header: '是否含有數據', key: 'status', style: styles.cellStatus },
    { header: '合格', key: 'qualified', style: styles.cellQualified },
    { header: '不合格', key: 'unQualified', style: styles.cellunQualified },
    { header: '安全性危害', key: 'safety', style: styles.cellSafety },
    { header: '抽查人員', key: 'tester', style: styles.cellTester },
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
      <Text style={styles.mainTitle}>{'外觀，功能及數據清除抽查確認表'}</Text>
      <View style={styles.table}>
        {/* First Header Row: "外觀分類" spanning appearance columns */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellNO, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellDate, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellBrand, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellC, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellF, styles.firstHeaderCell]}></Text>
          <Text style={[styles.tableCell, styles.headerCell, styles.cellStatus, styles.firstHeaderCell]}></Text>
          
          {/* 抽查結果 spanning header */}
          <Text
            style={[
              styles.spanningHeaderCell,
              { width: '25%' }, // 修改寬度為合格(10%)和不合格(15%)的總和
            ]}
          >
            抽查結果
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
            <Text style={[styles.tableCell, styles.cellC]}>{'C5'}</Text>
            <Text style={[styles.tableCell, styles.cellF]}>{'F4'}</Text>
            <Text style={[styles.tableCell, styles.cellStatus]}>{'n/a'}</Text>
            <Text style={[styles.tableCell, styles.cellQualified]}>{'V'}</Text>
            <Text style={[styles.tableCell, styles.cellunQualified]}>{''}</Text>
            <Text style={[styles.tableCell, styles.cellSafety]}>{'X'}</Text>
            <Text style={[styles.tableCell, styles.cellTester]}>{'Jim'}</Text>
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

export default RepairPDF;