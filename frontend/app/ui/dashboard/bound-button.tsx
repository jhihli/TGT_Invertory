import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { exportToDestructionForm } from '@/app/lib/exportDestruction';
import { getSSDForExport } from "@/app/lib/data";
import { useState } from 'react';
import { exportToWipOSForm } from "@/app/lib/exportWipOS";
import { exportInbound } from "@/app/lib/exportInbound";
import { exportOutbound } from "@/app/lib/exportOutbound";

interface AppearanceFormButtonProps {
  query: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function BoundButton({ query }: AppearanceFormButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleInBoundExport = async (category: number) => {
    setIsLoading(true);
    setLoadingCategory(category);
    setErrorMessage(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('search', query);
      }
      
      //If category is 0, print all products
      if (category > 0) {
        searchParams.append('category', category.toString());
      }
      
      const products = await getSSDForExport(searchParams.toString());

      if (!products || !Array.isArray(products) || products.length === 0) {
        setAlertMessage('沒有產品');
        setShowErrorDialog(true);
        return;
      }
         
      if (category === 0) {
        await exportInbound(products);
      } else if(category === 3){
        await exportToDestructionForm(products);
      }else if(category === 1){
        await exportToWipOSForm(products);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      setErrorMessage(`Export error: ${error instanceof Error ? error.message : String(error)}`);
      window.alert('Error exporting data. Please try again.');
    } finally {
      console.log('Export process completed, resetting state');
      setIsLoading(false);
      setLoadingCategory(null);
      setShowDialog(false);
    }
  };


  const handleOutBoundExport = async (category: number) => {
    setIsLoading(true);
    setLoadingCategory(category);
    setErrorMessage(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('search', query);
      }
      
      //If category is 0, print all products
      if (category > 0) {
        searchParams.append('category', category.toString());
      }
      
      const products = await getSSDForExport(searchParams.toString());

      if (!products || !Array.isArray(products) || products.length === 0) {
        setAlertMessage('沒有產品');
        setShowErrorDialog(true);
        return;
      }
         
      if (category === 0) {
        await exportOutbound(products);
      } else if(category === 3){
        await exportToDestructionForm(products);
      }else if(category === 1){
        await exportToWipOSForm(products);
      }

    } catch (error) {
      console.error('Error exporting data:', error);
      setErrorMessage(`Export error: ${error instanceof Error ? error.message : String(error)}`);
      window.alert('Error exporting data. Please try again.');
    } finally {
      console.log('Export process completed, resetting state');
      setIsLoading(false);
      setLoadingCategory(null);
      setShowDialog(false);
    }
  };


  const handleClick = async () => {
    if (!query.trim()) {
      setAlertMessage('請先在搜尋欄位輸入關鍵字');
      setShowErrorDialog(true);
      return;
    }
    setShowDialog(true);
  };

  return (
    <>
      <button
        onClick={() => handleClick()}
        disabled={isLoading}
        aria-label="Export data"
        className="flex items-center gap-2 px-4 py-2 font-medium text-white
        bg-red-500 hover:bg-red-600
        rounded-lg shadow-md
        transform transition-all duration-200 hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
        disabled:opacity-75"
        title="Export Products"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>出入庫單</span>
          </>
        )}
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-2xl w-96 transform transition-all scale-100 space-y-4 border border-gray-200/50">
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-3">
              <h3 className="text-xl font-semibold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">選擇匯出類型</h3>
              <button 
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={() => handleInBoundExport(0)}
                disabled={loadingCategory !== null}
                className="w-full py-3 px-4 text-left text-sm 
                  bg-white hover:bg-gray-50
                  rounded-lg transition-colors flex items-center justify-between
                  text-gray-700 hover:text-gray-900
                  border border-gray-200 hover:border-gray-300
                  disabled:opacity-50"
              >
                <span className="flex-1">入庫單</span>
                {loadingCategory === 0 ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="rgb(53, 53, 212)" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="rgb(53, 53, 212)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => handleOutBoundExport(0)}
                disabled={loadingCategory !== null}
                className="w-full py-3 px-4 text-left text-sm 
                  bg-white hover:bg-gray-50
                  rounded-lg transition-colors flex items-center justify-between
                  text-gray-700 hover:text-gray-900
                  border border-gray-200 hover:border-gray-300
                  disabled:opacity-50"
              >
                <span className="flex-1">出庫單</span>
                {loadingCategory === 0 ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="rgb(53, 53, 212)" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="rgb(53, 53, 212)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            <div className="border-t border-gray-200/80 pt-4">
              <button
                onClick={() => setShowDialog(false)}
                className="w-full py-2.5 px-4 text-sm text-center bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition-colors text-gray-600 font-medium border border-gray-200 hover:border-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

{showErrorDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                提示
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {alertMessage}
              </p>
              <button
                onClick={() => setShowErrorDialog(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}