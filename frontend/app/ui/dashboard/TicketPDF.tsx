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
    padding: 15, // 減少整體頁面的 padding
    paddingTop: 10, // 特別減少頂部的 padding
    fontFamily: 'NotoSansTC',
  },
  header: {
    marginBottom: 0, // 移除 header 的下方間距
    marginTop: 0, // 移除上方間距
    textAlign: 'left',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 0, // 移除下方間距
    marginTop: 0, // 移除上方間距
  },
  table: {
    display: 'flex',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf',
    fontSize: 10,
  },
  idCell: {
    flex: 0.5, // 較小的寬度
  },
  barcodeCell: {
    flex: 2, // 較大的寬度
  },
  quantityCell: {
    flex: 0.5, // 較小的寬度
  },
  defaultCell: {
    flex: 1, // 預設寬度
  },
  dateContainer: {
    marginBottom: 10,
    fontSize: 12,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
  },
  tableContainer: {
    marginBottom: 0, // 移除 tableContainer 的下方間距
  },
  columnsContainer: {
    flexDirection: 'row',
    
    marginTop: 0, // 移除上方間距
    marginBottom: 0, // 移除下方間距
  },
  column: {
    flex: 1,
  },
  footer: {
    marginTop: 18, // 添加 10 單位的上方邊距
    paddingTop: 0, // 移除 padding
  },
  processRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, 
  },
  processItem: {
    width: '15%',
    border: '1px solid #bfbfbf',
    padding: 3, 
  },
  processTitle: {
    fontSize: 10, 
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1, 
    fontFamily: 'NotoSansTC',
  },
  processText: {
    fontSize: 8, 
    marginBottom: 1, 
    fontFamily: 'NotoSansTC',
  },
  arrow: {
    alignSelf: 'center',
    fontSize: 12, 
    fontWeight: 'bold',
  },
  downArrow: {
    alignSelf: 'flex-end',
    fontSize: 12, 
    marginRight: 15, 
    fontWeight: 'bold',
  },
  headerTable: {
    marginBottom: 0, // 移除 headerTable 的下方間距
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  headerCell: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 8,
    flex: 1,
  },
  headerCell2: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
    flex: 2,
  },
  footerTable: {
    marginTop: 0,
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
  },
  footerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
  },
  footerCell: {
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: '#bfbfbf',
    fontSize: 8,
    flex: 1,
    textAlign: 'left', // 改為靠左對齊
    paddingLeft: 5, // 添加左側間距
  }
});

interface TicketPDFProps {
  products: Product[];
}

const ITEMS_PER_PAGE = 20;
const ITEMS_PER_COLUMN = 10;

const generateBarcodeImage = (value: string): string => {
  // 在 Node.js 環境中生成條碼
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, {
    format: "CODE128",
    width: 2,
    height: 50,
    displayValue: true
  });
  return canvas.toDataURL('image/png');
};

const calculateTotalQty = (products: Product[]): number => {
  return products.reduce((sum, product) => sum + (product.qty || 0), 0);
};

const TicketPDF = ({ products }: TicketPDFProps) => {
  // 新增隨機通過率計算
  const pass_random = Math.floor(Math.random() * 11) + 90;
  const fail_random = 100 - pass_random;

  // 按日期分組產品
  const groupedByDate = products.reduce((acc, product) => {
    const date = product.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // 將分組後的數據轉換為頁面數據
  const pages = Object.entries(groupedByDate).flatMap(([date, dateProducts]) => {
    const pageCount = Math.ceil(dateProducts.length / ITEMS_PER_PAGE);
    return Array.from({ length: pageCount }, (_, pageIndex) => ({
      date,
      products: dateProducts.slice(
        pageIndex * ITEMS_PER_PAGE,
        (pageIndex + 1) * ITEMS_PER_PAGE
      ),
    }));
  });

  const renderTableColumn = (products: Product[]) => (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.idCell]}>No:</Text>
        <Text style={[styles.tableCell, styles.barcodeCell]}>二維碼Barcode:</Text>
        <Text style={[styles.tableCell, styles.quantityCell]}>數量Qty:</Text>
      </View>

      {products.map((product, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.idCell]}>{product.id}</Text>
          <Text style={[styles.tableCell, styles.barcodeCell]}>{product.barcode}</Text>
          <Text style={[styles.tableCell, styles.quantityCell]}>{product.qty}</Text>
        </View>
      ))}
    </View>
  );

  const renderHeader = ({ date }: { date: string }) => {
    // 計算 IQC 1 和 OQC 日期
    const page_date = new Date(date + 'T00:00:00');
    const before10Date = new Date(page_date);
    const after2day = new Date(page_date);
    
    before10Date.setDate(before10Date.getDate() - 10);
    after2day.setDate(after2day.getDate() + 2);
  
    // 格式化日期
    const iqc1Date = formatDate(before10Date);
    const oqcDate = formatDate(after2day);
  
    // 將日期格式轉換為所需格式（移除橫線）
    const formattedDate = date.replace(/-/g, '');
    const barcodeContent = `TGT:${formattedDate}`;
    const barcodeImage = generateBarcodeImage(barcodeContent);
  
    return (
      <View style={styles.headerTable}>
        <View style={styles.headerRow}>
          <View style={[styles.headerCell2]}>
            <Image src={barcodeImage} style={{ width: '70%', height: 15 }} />
          </View>
          <Text style={[styles.headerCell]}>日期 Date: {date}</Text>
          <Text style={[styles.headerCell]}>工程師 Engineer:</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell]}>型號 Model:</Text>
          <Text style={[styles.headerCell]}>真空模具 Vacuum Jig no:</Text>
          <Text style={[styles.headerCell]}>托盤 Tray no:</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell]}>屏蔽罩 Mask no:</Text>
          <Text style={[styles.headerCell]}>電動刷 Brush no:</Text>
          <Text style={[styles.headerCell]}>乾燥箱 Dry no:</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell2]}>測試架 Test box:</Text>
          <Text style={[styles.headerCell2]}>備註 Note:</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell2]}>吹鍚程式 Tin blow program:</Text>
          <Text style={[styles.headerCell2]}>激光除鍚程式 Laser blow program:</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell2]}>激光植球程式 Laser bumping program:</Text>
          <Text style={[styles.headerCell2]}>備註 Note:</Text>
        </View>
      </View>
    );
  };

  const renderFooter = ({ date, products }: { date: string, products: Product[] }) => {
    const page_date = new Date(date + 'T00:00:00');
    const before10Date = new Date(page_date);
    const after2day = new Date(page_date);
    
    before10Date.setDate(before10Date.getDate() - 10);
    after2day.setDate(after2day.getDate() + 2);

    const totalQty = calculateTotalQty(products);
    const leftAmount = Math.floor(totalQty * (pass_random / 100)); // 計算剩餘數量

    return (
      <View style={styles.footer}>
        {/* First Row */}
        <View style={styles.processRow}>
          {['IQC 1', '烘烤', '除膠', '去底板', '除底膠'].map((title, index) => (
            <React.Fragment key={index}>
              <View style={styles.processItem}>
                <Text style={styles.processTitle}>{title}</Text>
                <Text style={styles.processText}>人員:</Text>
                {title === 'IQC 1' ? (
                  <Text style={styles.processText}>
                    日期: {formatDate(before10Date)}
                  </Text>
                ) : (
                  <Text style={styles.processText}>日期:</Text>
                )}
                {title === 'IQC 1' ? (
                  <Text style={styles.processText}>數量: {totalQty}</Text>
                ) : (
                  <Text style={styles.processText}>數量:</Text>
                )}
              </View>
              {index < 4 && <Text style={styles.arrow}>→</Text>}
            </React.Fragment>
          ))}
        </View>

        {/* Down Arrow */}
        <View style={[styles.processRow, { justifyContent: 'flex-end' }]}>
          <Text style={styles.downArrow}>↓</Text>
        </View>

        {/* Second Row */}
        <View style={styles.processRow}>
          {['激光除鍚', '超聲波清洗', 'IQC 3', '吹鍚', 'IQC 2'].map((title, index) => (
            <React.Fragment key={index}>
              <View style={styles.processItem}>
                <Text style={styles.processTitle}>{title}</Text>
                <Text style={styles.processText}>人員:</Text>
                <Text style={styles.processText}>日期:</Text>
                <Text style={styles.processText}>數量:</Text>
              </View>
              {index < 4 && <Text style={styles.arrow}>←</Text>}
            </React.Fragment>
          ))}
        </View>

        {/* Down Arrow */}
        <View style={[styles.processRow, { justifyContent: 'flex-start' }]}>
          <Text style={styles.downArrow}>↓</Text>
        </View>

        {/* Third Row */}
        <View style={styles.processRow}>
          {['IQC 4', '激光植球', 'IQC 5', '測試', 'OQC'].map((title, index) => (
            <React.Fragment key={index}>
              <View style={styles.processItem}>
                <Text style={styles.processTitle}>{title}</Text>
                <Text style={styles.processText}>人員:</Text>
                {title === 'OQC' ? (
                  <Text style={styles.processText}>
                    日期: {formatDate(after2day)}
                  </Text>
                ) : (
                  <Text style={styles.processText}>日期:</Text>
                )}
                {title === 'OQC' ? (
                  <Text style={styles.processText}>數量: {leftAmount}</Text>
                ) : (
                  <Text style={styles.processText}>數量:</Text>
                )}
              </View>
              {index < 4 && <Text style={styles.arrow}>→</Text>}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Document>
      {pages.map((page, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>工程票 Batch Ticket</Text>
          </View>

          {renderHeader({ date: page.date })}

          <View>
            <View style={styles.columnsContainer}>
              <View style={styles.column}>
                {renderTableColumn(page.products.slice(0, ITEMS_PER_COLUMN))}
              </View>
              <View style={styles.column}>
                {renderTableColumn(page.products.slice(ITEMS_PER_COLUMN, ITEMS_PER_PAGE))}
              </View>
            </View>

            {/* 移動到這裡的 footerTable */}
            <View style={styles.footerTable}>
              <View style={styles.footerRow}>
                <Text style={styles.footerCell}>一次性通過率Pass rate(%): {pass_random}%</Text>
                <Text style={styles.footerCell}>返工率Rework(%):</Text>
                <Text style={styles.footerCell}>報廢率Fail(%): {fail_random}%</Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerCell}>合格Pass:</Text>
                <Text style={styles.footerCell}>返工Rework:</Text>
                <Text style={styles.footerCell}>報廢Fail:</Text>
              </View>
            </View>
          </View>

          {renderFooter({ date: page.date, products: page.products })}

          <Text style={styles.pageNumber}>
            Page {pageIndex + 1} of {pages.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
};

export default TicketPDF;
