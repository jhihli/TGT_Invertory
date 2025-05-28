import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { Product } from "@/interface/IDatatable";
import { exportTicket } from '@/app/lib/exportTicket';
import { getAllProductsForExport } from "@/app/lib/data";
import { useState } from 'react';

interface TicketButtonProps {
  query: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function TicketButton({ query }: TicketButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleClick = async () => {
    if (!query.trim()) {
      setAlertMessage('請先輸入搜尋關鍵字');
      setShowErrorDialog(true);
      return;
    }
    
    setIsLoading(true);
    try {
      const products = await getAllProductsForExport(query);

      if (!products || !Array.isArray(products) || products.length === 0) {
        setAlertMessage('請重新輸入關鍵字，沒有符合的產品');
        setShowErrorDialog(true);
        return;
      }

      await exportTicket(products);
    } catch (error) {
      console.error('Error exporting data:', error);
      setAlertMessage('匯出過程發生錯誤，請稍後再試');
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        aria-label="Export data"
        className="flex items-center gap-2 px-4 py-2 font-medium text-white
          bg-green-500 hover:bg-green-600
          rounded-lg shadow-md
          transform transition-all duration-200 hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2
          disabled:opacity-75"
        title="Export Products"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="rgb(53, 53, 212)" strokeWidth="4"></circle>
              <path className="opacity-75" fill="rgb(53, 53, 212)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Ticket</span>
          </>
        )}
      </button>

      {showErrorDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setShowErrorDialog(false)}
        >
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p>{alertMessage}</p>
            <button 
              onClick={() => setShowErrorDialog(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </>
  );
}