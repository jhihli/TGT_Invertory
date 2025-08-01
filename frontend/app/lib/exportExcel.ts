import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Product } from '@/interface/IDatatable';

export const exportToExcel = (products: Product[]) => {
  // 定義要導出的列
  const exportColumns = [
    { header: 'ID', key: 'id' },
    { header: 'so_number', key: 'so_number' },
    { header: 'Number', key: 'number' },
    { header: 'Barcode', key: 'barcode' },
    { header: 'Quantity', key: 'qty' },
    { header: 'Weight', key: 'weight' },
    { header: 'Date', key: 'date' },
    { header: 'Ship Date', key: 'ex_date' },
    { header: 'Vendor', key: 'vender' },
    { header: 'Client', key: 'client' },
    { header: 'Category', key: 'category' },
    { header: 'Status', key: 'current_status' },
    { header: 'Note', key: 'noted' },
  ];

  // 格式化數據
  const exportData = products.map(product => {
    const row: any = {};
    exportColumns.forEach(col => {
      if (col.key === 'current_status') {
        row[col.header] = product.current_status === '0' ? '入庫' : (product.current_status === '1' ? '出貨' : product.current_status);
      } else {
        row[col.header] = product[col.key as keyof Product];
      }
    });
    return row;
  });

  // 創建工作表
  const worksheet = XLSX.utils.json_to_sheet(exportData, {
    header: exportColumns.map(col => col.header)
  });

  // 創建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // 生成 Excel 文件並下載
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // 使用當前日期作為文件名
  const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(data, fileName);
};
