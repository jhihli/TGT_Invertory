import { pdf } from '@react-pdf/renderer';
import { Product } from '@/interface/IDatatable';
import RamDiagnosticPDF from '@/app/ui/dashboard/RamDiagnosticPDF';
import { ReactElement } from 'react';

export const exportToDiagnosticForm = async (products: Product[]) => {
  // 創建 PDF blob
  const blob = await pdf(RamDiagnosticPDF({ products }) as ReactElement).toBlob();
  
  const formatDate = (date: any) => {
    try {
      const d = new Date(date);
      // 調整時區，加入 8 小時
      d.setHours(d.getHours() + 8);
      return d.toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei'
      });
    } catch {
      return new Date().toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei'
      });
    }
  };

  // 創建下載連結
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ram_diagnostic_${formatDate(products[0].date)}.pdf`;
  
  // 觸發下載
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理 URL
  URL.revokeObjectURL(url);
};
