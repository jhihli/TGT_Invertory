import { pdf } from '@react-pdf/renderer';
import { Product } from '@/interface/IDatatable';
import DestructionPDF from '../ui/dashboard/DestructionPDF';
import { ReactElement } from 'react';

export const exportToDestructionForm = async (products: Product[]) => {
  
  // Show progress to user if large dataset
  let loadingModal: HTMLDivElement | null = null;
  let progressText: HTMLDivElement | null = null;

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
  
  // Create loading modal for large datasets
  if (products.length > 50) {
    loadingModal = document.createElement('div');
    loadingModal.style.position = 'fixed';
    loadingModal.style.top = '0';
    loadingModal.style.left = '0';
    loadingModal.style.width = '100%';
    loadingModal.style.height = '100%';
    loadingModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    loadingModal.style.display = 'flex';
    loadingModal.style.justifyContent = 'center';
    loadingModal.style.alignItems = 'center';
    loadingModal.style.zIndex = '9999';
    
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.width = '400px';
    modalContent.style.textAlign = 'center';
    
    const header = document.createElement('h3');
    header.textContent = '生成PDF中...';
    header.style.marginBottom = '15px';
    
    progressText = document.createElement('div');
    progressText.textContent = '正在處理大量數據，請稍候...';
    progressText.style.marginBottom = '15px';
    
    const spinner = document.createElement('div');
    spinner.style.border = '5px solid #f3f3f3';
    spinner.style.borderTop = '5px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '30px';
    spinner.style.height = '30px';
    spinner.style.margin = '0 auto';
    spinner.style.animation = 'spin 2s linear infinite';
    
    // Add keyframes for spinner animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    modalContent.appendChild(header);
    modalContent.appendChild(progressText);
    modalContent.appendChild(spinner);
    loadingModal.appendChild(modalContent);
    document.body.appendChild(loadingModal);
  }
  
  try {
    
    const defaultVendor = 'TGT'; // Default vendor value
    
    // Update progress
    if (progressText) {
      progressText.textContent = '正在創建PDF組件...';
    }
    
    const pdfComponent = DestructionPDF({ 
      products, 
      vendor: defaultVendor 
    }) as ReactElement;
    
    // Update progress
    if (progressText) {
      progressText.textContent = '正在渲染PDF...這可能需要一些時間';
    }
    
    // Create PDF with a progress callback
    const pdfPromise = pdf(pdfComponent).toBlob();
    
    // Add a timeout - increased to 120 seconds for very large datasets
    const timeoutDuration = products.length > 100 ? 180000 : 120000; // 3 minutes for very large datasets, 2 minutes otherwise
    
    // Update progress text with timeout info
    if (progressText) {
      progressText.textContent = `正在渲染PDF...最多等待 ${timeoutDuration/1000} 秒`;
    }
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`PDF generation timed out after ${timeoutDuration/1000} seconds`)), timeoutDuration);
    });
    
    const blob = await Promise.race([pdfPromise, timeoutPromise]) as Blob;
    
    // Update progress
    if (progressText) {
      progressText.textContent = '正在準備下載...';
    }
    
    // Create download link
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `destruction_report_${formatDate(products[0].date)}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL
    URL.revokeObjectURL(url);
    
    // Clean up loading modal
    if (loadingModal) {
      document.body.removeChild(loadingModal);
    }

    return true;
  } catch (error) {
    console.error("Error in PDF generation:", error);
    
    // Clean up loading modal
    if (loadingModal) {
      document.body.removeChild(loadingModal);
    }
    
    // Provide a helpful error message
    if (error.message && error.message.includes('tables')) {
      window.alert("PDF生成時出現字體問題。請稍後再試。");
    } else if (error.message && error.message.includes('timed out')) {
      window.alert("PDF生成超時。數據量可能太大，請嘗試減少所選產品數量或分批導出。");
    } else {
      window.alert(`PDF生成時出錯: ${error.message}`);
    }
    
    throw error;
  }
};
