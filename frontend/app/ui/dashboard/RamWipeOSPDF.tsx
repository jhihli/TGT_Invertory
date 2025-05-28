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
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    borderBottom: '1px solid #eeeeee',
  },
  tableHeader: {
    backgroundColor: 'white',
    color: 'black',
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    textAlign: 'center',
    fontFamily: 'NotoSansTC',
  },
  headerCell: {
    backgroundColor: 'white',
    color: 'black',
    fontWeight: 'bold',
    borderBottom: '1px solid #eeeeee',
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
    borderBottom: '1px solid #eeeeee',
    height: '50%',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lowerText: {
    borderBottom: '1px solid #eeeeee',
    height: '50%',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 為不同列寬定義不同的樣式
  cellNO: { width: '8%' },           
  cellBrand: { width: '9%' },       
  cellModel: { width: '9%' },        
  cellSerial: { width: '9%' },      
  cellSize: { width: '4%' },         
  cellOperator: { width: '7%' },     
  cellNotes: { width: '4%' },        
  cellPower: { width: '10%' },       
  cellAction: { width: '18%' },       
  cellDate: { width: '8%' },        
  cellStatus: { width: '7%' },       
  cellHealth: { width: '7%' },       
  titleContainer: {
    marginBottom: 2, // 減少底部邊距
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end', // 將容器內容靠右對齊
  },
  titleImage: {
    width: '50%', // 調整寬度
    height: '50%', // 調整高度
    marginBottom: 0, // 添加底部邊距
  },
  
  
  firstHeaderCell: {
    borderBottomWidth: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 10,
  },
  iconText: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  icon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  headerText: {
    fontSize: 10,
  },
  actionButton: {
    backgroundColor: '#90bfde',
    padding: '4px 8px',
    borderRadius: 4,
    marginLeft: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 10,
    color: 'black',
    marginLeft: 4,
  },
  secondHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  wipeOsText: {
    fontSize: 10,
    marginLeft: 0,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableFooter: {
    marginTop: 'auto',
    borderTop: '2px solid #000',
  },
  footerRow: {
    margin: 'auto',
    flexDirection: 'row',
    backgroundColor: '#90bfde',
  },
  footerCell: {
    padding: 4,
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

const RamWipeOSPDF = ({ products }: { products: Product[] }) => {
  const generateRandomSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const randomChars = Array(4).fill(null).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    const randomNums = Array(7).fill(null).map(() => nums[Math.floor(Math.random() * nums.length)]).join('');
    return `DD-${randomChars}${randomNums}`;
  };

  const generateRandomPowerOnHours = () => {
    return Math.floor(Math.random() * (50000 - 30000 + 1)) + 30000;
  };

  const generateRandomInterface = () => {
    const interfaces = ['SAS (SPL-3)', 'SATA 3.1', 'SATA 2.6', 'SATA 3.0'];
    return interfaces[Math.floor(Math.random() * interfaces.length)];
  };

  // 處理可能的空值
  const getDisplayValue = (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const columns = [
    { header: 'Interface', key: 'interface', style: styles.cellNO },
    { header: '型号', key: 'number', style: styles.cellBrand },
    { header: 'Model', key: 'model', style: styles.cellModel },
    { header: 'Serial', key: 'serial', style: styles.cellSerial },
    { header: 'Size', key: 'size', style: styles.cellSize },
    { header: 'Operator', key: 'operator', style: styles.cellOperator },
    { header: 'Notes', key: 'notes', style: styles.cellNotes },
    { header: 'Power-On Hours', key: 'power', style: styles.cellPower },
    { header: 'Wipe Action', key: 'action', style: styles.cellAction },
    { header: 'Wipe Date', key: 'date', style: styles.cellDate },
    { header: 'Wipe Status', key: 'status', style: styles.cellStatus },
    { header: 'HDD Health', key: 'health', style: styles.cellHealth },
  ];

  // 計算每頁可以顯示的行數
  const ROWS_PER_PAGE = 15; // 調整這個數字以適應標題後的可用空間

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

  const renderPageContent = (pageProducts: Product[], pageIndex: number) => (
    <>
      <View style={styles.titleContainer}>
        <Image src="/wipeos_title.png" style={styles.titleImage} />
      </View>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, styles.headerCell, { width: '100%', height: 24, backgroundColor: '#90bfde' }, styles.firstHeaderCell]}>
            <View style={styles.iconText}>
              <Image src="/credit.png" style={styles.icon} />
              <Text style={styles.headerText}>BUY CREDITS</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/account.png" style={styles.icon} />
              <Text style={styles.headerText}>ACCOUNT</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/usb.png" style={styles.icon} />
              <Text style={styles.headerText}>USB WIPERS</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/boxes.png" style={styles.icon} />
              <Text style={styles.headerText}>WIPE BOXES</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/disk.png" style={styles.icon} />
              <Text style={styles.headerText}>DISK LOGS</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/logs.png" style={styles.icon} />
              <Text style={styles.headerText}>DIAGNOSTIC LOGS</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/mobile.png" style={styles.icon} />
              <Text style={styles.headerText}>MOBILE</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/imaging.png" style={styles.icon} />
              <Text style={styles.headerText}>IMAGING</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/report.png" style={styles.icon} />
              <Text style={styles.headerText}>REPORTS</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/FAQ.png" style={styles.icon} />
              <Text style={styles.headerText}>FAQ</Text>
            </View>
            <View style={styles.iconText}>
              <Image src="/logout.png" style={styles.icon} />
              <Text style={styles.headerText}>LOGOUT</Text>
            </View>
          </View>
        </View>

        {/* Second Header Row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCell, styles.headerCell, { width: '100%', height: 24, backgroundColor: 'white' }, styles.secondHeaderRow]}>
            
            <View style={styles.iconText}>
              <Image src="/list.png" style={styles.icon} />
              <Text style={styles.wipeOsText}>WipeOS</Text>
            </View>

            <View style={styles.buttonContainer}>
              <View style={styles.actionButton}>
                <Image src="/export.png" style={styles.icon} />
              </View>
              <Text style={styles.buttonText}>EXPORT</Text>
              <View style={styles.actionButton}>
                <Image src="/certification.png" style={styles.icon} />
              </View>
              <Text style={styles.buttonText}>CERTIFICATION</Text>
            </View>
          </View>
        </View>

        {/* Third Header Row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          {columns.map((column, i) => renderHeaderCell(column, i))}
        </View>

        {/* 數據行 */}
        {pageProducts.map((product, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.cellNO]}>{generateRandomInterface()}</Text> 
            <Text style={[styles.tableCell, styles.cellBrand]}>{getDisplayValue(product.barcode)}</Text>
            <Text style={[styles.tableCell, styles.cellModel]}>{getDisplayValue(product.number)}</Text>
            <Text style={[styles.tableCell, styles.cellSerial]}>{generateRandomSerial()}</Text>
            <Text style={[styles.tableCell, styles.cellSize]}>{''}</Text>
            <Text style={[styles.tableCell, styles.cellOperator]}>{'admin'}</Text>
            <Text style={[styles.tableCell, styles.cellNotes]}>{'□'}</Text>
            <Text style={[styles.tableCell, styles.cellPower]}>{generateRandomPowerOnHours()}</Text>
            <Text style={[styles.tableCell, styles.cellAction]}>{'NIST SP 800r1 Clear(1-pass) Verified'}</Text>
            <Text style={[styles.tableCell, styles.cellDate]}>{getDisplayValue(product.date)}</Text>
            <Text style={[styles.tableCell, styles.cellStatus]}>{'Success'}</Text>
            <Text style={[styles.tableCell, styles.cellHealth]}>{'Success'}</Text>
          </View>
        ))}
      </View>

      {/* 在表格數據後添加頁尾 */}
      <View style={styles.tableFooter}>
        <View style={styles.footerRow}>
          <Text style={[styles.footerCell, styles.cellNO]}>Summary</Text>
          <Text style={[styles.footerCell, styles.cellBrand]}>{pageProducts.length}</Text>
          <Text style={[styles.footerCell, styles.cellModel]}></Text>
          <Text style={[styles.footerCell, styles.cellSerial]}>-</Text>
          <Text style={[styles.footerCell, styles.cellSize]}>-</Text>
          <Text style={[styles.footerCell, styles.cellOperator]}>-</Text>
          <Text style={[styles.footerCell, styles.cellNotes]}>-</Text>
          <Text style={[styles.footerCell, styles.cellPower]}>-</Text>
          <Text style={[styles.footerCell, styles.cellAction]}>-</Text>
          <Text style={[styles.footerCell, styles.cellDate]}>-</Text>
          <Text style={[styles.footerCell, styles.cellStatus]}>-</Text>
          <Text style={[styles.footerCell, styles.cellHealth]}>Page: {pageIndex + 1}</Text>
        </View>
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
          {renderPageContent(getPageProducts(pageIndex), pageIndex)}
        </Page>
      ))}
    </Document>
  );
};

export default RamWipeOSPDF;