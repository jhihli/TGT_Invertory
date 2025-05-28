import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Product } from '@/interface/IDatatable';
import React from 'react';

// Try different font registration approaches
try {
  
  Font.register({
    family: 'NotoSansTC',
    src: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-tc@4.5.12/files/noto-sans-tc-all-400-normal.woff',
    fontWeight: 'normal',
    fontStyle: 'normal',
  });
  
} catch (error) {
  console.error("Font registration error:", error);
}

// Helper function to calculate date 2 days before
const calculateBefore2DayDate = (dateString: string): string => {
  try {
    // Parse the input date
    const currentDate = new Date(dateString + 'T00:00:00');
    // Calculate date 2 days before
    const before2day = new Date(currentDate);
    before2day.setDate(before2day.getDate() - 2);
    
    // Format the date as yyyy-mm-dd
    const year = before2day.getFullYear();
    const month = String(before2day.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
    const day = String(before2day.getDate()).padStart(2, '0'); // Add leading zero if needed
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error calculating date:", error);
    return dateString; // Return original date on error
  }
};

// Helper function to validate and get a default date in YYYY-MM-DD format
const getValidDate = (products: Product[]): string => {
  try {
    // Check if products array exists and has at least one item
    if (products && products.length > 0 && products[0].date) {
      console.log("Found date in products[0]:", products[0].date);
      
      // Validate the date format (should be YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(products[0].date)) {
        return products[0].date;
      } else {
        console.warn("Invalid date format in products[0].date:", products[0].date);
      }
    } else {
      console.warn("No valid date found in products array");
    }
    
    // Fallback to current date if no valid date found
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    console.log("Using current date as fallback:", currentDate);
    return currentDate;
  } catch (error) {
    console.error("Error in getValidDate:", error);
    // Ultimate fallback - today's date
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
};

// Generate random number between min and max (inclusive)
// This matches the generateRandomNumber function in destruction-data.js
const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate random string of specified length
// This matches the generateRandomString function in destruction-data.js
const generateRandomString = (length: number): string => {
  try {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  } catch (error) {
    console.error("Error in generateRandomString:", error);
    return "ERROR";
  }
};

// Generate random digits of specified length
// This matches the RandomNumber function in destruction-data.js
const generateRandomDigits = (length: number): string => {
  try {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  } catch (error) {
    console.error("Error in generateRandomDigits:", error);
    return "0";
  }
};

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'NotoSansTC',  // Use NotoSansTC as the primary font
    fontSize: 10,
  },
  title: {
    fontSize: 24,  // Reduced from 30 to improve performance
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    borderBottom: '1px solid black',
    paddingBottom: 10,
  },
  welcomeText: {
    color: '#0000FF',
    marginBottom: 5,
    fontSize: 10,
  },
  greenText: {
    color: '#008000',
    marginBottom: 5,
    fontSize: 10,
  },
  normalText: {
    marginBottom: 5,
    fontSize: 10,
  },
  blueText: {
    color: '#0000FF',
    marginBottom: 5,
    fontSize: 10,
  },
  deviceInfo: {
    marginBottom: 5,
    fontSize: 10,
  },
  detailContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  productDetail: {
    color: '#008000',
    marginBottom: 8,
    fontSize: 10,
  },
  emmcDetail: {
    color: '#0000FF',
    marginBottom: 8,
    fontSize: 10,
  },
  footer: {
    marginTop: 20,
    color: '#008000',
    fontSize: 10,
  },
  statusInfo: {
    color: '#0000FF',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 10,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 25,
    alignItems: 'center',
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
  },
});

const DestructionPDF = ({ products, vendor }: { 
  products: Product[], 
  vendor: string 
}) => {
  // Log props received
  console.log("DestructionPDF rendering with:", { 
    productsCount: products.length, 
    vendor 
  });

  try {
    // Limit the number of products to process
    // This helps prevent performance issues with very large datasets
    const MAX_PRODUCTS_PER_PAGE = 25;
    const totalProducts = products.length;
    
    // Create pages based on product count
    const totalPages = Math.ceil(totalProducts / MAX_PRODUCTS_PER_PAGE);
    console.log(`Creating PDF with ${totalPages} pages for ${totalProducts} products`);
    
    // Get a validated date from the products array
    const date = getValidDate(products);

    // Calculate date 2 days before
    const before2dayDate = calculateBefore2DayDate(date);
    
    // Calculate total amount
    const totalAmount = products.reduce((sum, product) => {
      const qty = Number(product.qty || 0);
      return sum + qty;
    }, 0);
    
    // Create a mutable date object that will be incremented for each time generation
    const baseDate = new Date();
    
    // Generate random time function following destruction-data.js implementation
    const generateRandomTime = () => {
      try {
        // Generate a random value between 1 and 10 to increment seconds
        const randomValue = Math.floor(Math.random() * 10) + 1;
        
        // Update the time with a random value
        baseDate.setSeconds(baseDate.getSeconds() + randomValue);
        
        // Get the updated time components
        const hours = baseDate.getHours();
        const minutes = baseDate.getMinutes();
        const seconds = baseDate.getSeconds();
        
        // Format as HH:MM:SS AM/PM
        let timeString = `${hours}:${minutes}:${seconds}`;
        
        // Add AM/PM designation
        if (hours >= 12) {
          timeString += ' PM';
        } else {
          timeString += ' AM';
        }
        
        return timeString;
      } catch (error) {
        console.error("Error in generateRandomTime:", error);
        return "00:00:00 AM";
      }
    };

    // Generate EXT_CSD string exactly like in destruction-data.js
    const generateExtCsdString = (): string => {
      try {
        return [
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00Fh', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00Ah', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h', 
          generateRandomNumber(150, 250) + '=00h'
        ].join(', ');
      } catch (error) {
        console.error("Error in generateExtCsdString:", error);
        return "150=00h";
      }
    };
    
    // Helper function to render product details for a page
    const renderProductPage = (pageProducts: Product[], pageIndex: number) => (
      <Page key={`page-${pageIndex}`} size="A4" style={styles.page}>
        <View style={styles.table}>
          {pageIndex === 0 && (
            <>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.title]}>資料銷毀證明</Text>
              </View>

              {/* Initial system information */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>歡迎使用UP-828E 超級編程器...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>軟件版本:V2.0.3.1, 更新日期4/26/2023...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>加載數據庫...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>打開窗口[eMMC_X4 - 準備擦除]...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>已選擇器件:EMMC[eMMC]eMMC_VBGA169X4 @FBGA169-0.50 #VBGA169PX4...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.normalText]}>已指定算法:eMMC_X4...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.normalText]}>請根據燒錄方案需求如下流程操作:選擇器件{'>'}選擇算法{'>'}打開文件{'>'}設置算法{'>'}自動編程/啟動量產...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>連接主機...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>找到主機1, 主機型号: UP-828E#E...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.normalText]}>關閉窗口[eMMC_X4 - 準備擦除](通過按[確定])...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>擦除器件...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>打開窗口[eMMC_X4 - 準備擦除]...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.normalText]}>關閉窗口[eMMC_X4 - 準備擦除](通過按[確定])...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>打開窗口[eMMC_X4 - 準備擦除]...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.normalText]}>關閉窗口[eMMC_X4 - 準備擦除](通過按[確定])...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>主機1:適配器狀熊: #1=NT, #2=NT, #3=NG, #4=NG...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>主機1:檢測到供電過流!請重新放置器件, 或者更換器件..."StartProgram</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>打開窗口[eMMC_X4 - 準備擦除]...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.normalText]}>關閉窗口[eMMC_X4 - 準備擦除](通過按[確定])...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>主機1:檢測到供電流!..."StartProgram</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.blueText]}>主機1:適配器-器件廠商= {vendor}, 日期: {before2dayDate}...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>擦除器件...</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.welcomeText]}>開始擦除器件...</Text>
              </View>
            </>
          )}

          {/* Device details - limited to MAX_PRODUCTS_PER_PAGE per page */}
          {pageProducts.map((product, index) => {
            // Limit the number of ext_csd details per product to improve performance
            const maxExtCsdDetails = Math.min(Number(product.qty) || 0, 3);
            
            return (
              <React.Fragment key={index}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.productDetail]}>
                    適配器: 型號:{product.barcode || 'Unknown'}, 數量:{product.qty || '0'}, 型號廠商: {product.vender || 'Unknown'}, 
                    MID= {generateRandomDigits(2)}h, 
                    PNM={generateRandomDigits(12)}h, 
                    CID={generateRandomString(32)}Fh ({before2dayDate} {generateRandomTime()})
                  </Text>
                </View>

                {/* Generate limited EXT_CSD details for each product */}
                {Array.from({ length: maxExtCsdDetails }).map((_, i) => (
                  <React.Fragment key={`${index}-${i}`}>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.emmcDetail]}>
                        EXT_CSD_{i + 1}__{product.barcode || 'Unknown'}: {generateExtCsdString()}
                      </Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.emmcDetail]}>
                        擦空值: 0x00, eMMC v5.0:已有區域及其容量: USER={generateRandomNumber(15000, 16000)}MB, 
                        BOOT1\BOOT2= true, RPMB= true, EMMC_x4...
                      </Text>
                    </View>
                  </React.Fragment>
                ))}

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.productDetail]}>
                    適配器: eMMC 0x00 器件信息:{product.barcode || 'Unknown'}, 數量:{product.qty || '0'}...擦空Finish
                  </Text>
                </View>
              </React.Fragment>
            );
          })}

          {/* Final status - only on the last page */}
          {pageIndex === totalPages - 1 && (
            <>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>
                  主機1: 適配器: eMMC 0x00 擦空Total amount: {totalAmount}...Done
                </Text>
              </View>

              {/* Footer status information */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.statusInfo]}>
                  主機1:適配器狀熊: #1=OK, #2=OK, #3=OK, #4=OK, 已放置器件在#1,#2,#3,#4
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.statusInfo]}>
                  EXT_CSD:179=00H, 177=00h, 178=00h, 173=00h,171=00h,162=00h,167=1Fh,166=05h,155=00h,156=00h
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>142:140=000000h,241=0Ah;</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.statusInfo]}>
                  擦空值:0x00, 192=07:eMMC v5.0:已有區域及其容量:USER=15032MB, BOOT1\BOOT2=4096KB, RPMB=4096KB...
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.statusInfo]}>
                  主機1:正在擦除器件 USER,1,2,3,4...
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>主機1:擦除成功在 USER</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>主機1:擦除成功在 BOOT1</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>主機1:擦除成功在 BOOT2</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.greenText]}>主機1:擦除器件完成(#1=OK, #2=OK, #3=OK, #4=OK)....Done</Text>
              </View>
              
              {/* Add page info */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { fontSize: 8, textAlign: 'center', marginTop: 10 }]}>
                  頁面 {pageIndex + 1} / {totalPages} - 共 {totalProducts} 產品
                </Text>
              </View>
            </>
          )}
          
          {/* Page information for non-last pages */}
          {pageIndex !== totalPages - 1 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontSize: 8, textAlign: 'center', marginTop: 10 }]}>
                頁面 {pageIndex + 1} / {totalPages} - 繼續下一頁
              </Text>
            </View>
          )}
        </View>
      </Page>
    );
    
    // Create pages array with chunked products
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * MAX_PRODUCTS_PER_PAGE;
      const endIndex = Math.min(startIndex + MAX_PRODUCTS_PER_PAGE, totalProducts);
      const pageProducts = products.slice(startIndex, endIndex);
      pages.push(renderProductPage(pageProducts, i));
    }
    
    return (
      <Document>
        {pages}
      </Document>
    );
  } catch (error) {
    console.error("Error in DestructionPDF component:", error);
    // Return a very basic document in case of error
    return (
      <Document>
        <Page size="A4">
          <View>
            <Text>Error generating the destruction report. Please try again.</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export default DestructionPDF;
