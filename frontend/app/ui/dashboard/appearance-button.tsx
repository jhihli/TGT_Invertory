import { DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { exportToAppearanceForm } from '@/app/lib/exportAppearance';
import { exportToRepairForm } from '@/app/lib/exportRepair';
import { exportToCheckForm } from '@/app/lib/exportCheck';
import { getSSDForExport } from "@/app/lib/data";
import { useState } from 'react';

interface AppearanceFormButtonProps {
  query: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function AppearanceFormButton({ query }: AppearanceFormButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleExport = async (category: number) => {
    setLoadingCategory(category);
    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('search', query);
      }
      
      //If category is 0, print all products
      if (category > 0) {
        searchParams.append('category', `${category.toString()}`);
      }
      console.log(searchParams.toString());
      const products = await getSSDForExport(searchParams.toString());

      if (!products || !Array.isArray(products) || products.length === 0) {
        setAlertMessage('沒有符合的產品');
        setShowErrorDialog(true);
        return;
      }

      if (category === 0) {
        await exportToRepairForm(products);
      } else {
        await exportToAppearanceForm(products);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
      setLoadingCategory(null);
      setShowDialog(false);
    }
  };

  const handleCheckExport = async () => {
    setLoadingCategory(3);
    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('search', query);
      }
      
      const products = await getSSDForExport(searchParams.toString());
      if (!products || !Array.isArray(products)) {
        throw new Error('Invalid data format received');
      }

      // 選取 20% 的隨機樣本，最少 20 筆
      const sampleSize = Math.max(Math.ceil(products.length * 0.1), 20);
      const sampledProducts = products
        .sort(() => Math.random() - 0.5)  // 隨機打亂陣列
        .slice(0, Math.min(sampleSize, products.length));  // 取前 N 筆
      console.log('Sampled products:', sampledProducts);

      await exportToCheckForm(sampledProducts);
      
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
      setLoadingCategory(null);
      setShowDialog(false);
    }
  };

  const handleClick = async (category: number) => {
    if (!query.trim()) {
      setAlertMessage('請先在搜尋欄位輸入關鍵字');
      setShowErrorDialog(true);
      return;
    }

    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('search', query);
      }

      const products = await getSSDForExport(searchParams.toString());
      if (!products || !Array.isArray(products) || products.length === 0) {
        setAlertMessage('請重新輸入關鍵字，沒有符合的產品');
        setShowErrorDialog(true);
        return;
      }

      setShowDialog(true);
    } catch (error) {
      console.error('Error checking products:', error);
      setAlertMessage('檢查產品時發生錯誤，請重試');
      setShowErrorDialog(true);
    }
  };

  
  const handlessdExport = async () => {
    //setLoadingCategory(category);
    try {
      const searchParams = new URLSearchParams();
      if (query) {
        searchParams.append('search', query);
      }
      
      searchParams.append('category', '1');
      searchParams.append('category', '3');
      
      
      const products = await getSSDForExport(searchParams.toString());

      if (!products || !Array.isArray(products) || products.length === 0) {
        setAlertMessage('沒有符合的產品');
        setShowErrorDialog(true);
        return;
      }

      await exportToAppearanceForm(products);
      
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
      setLoadingCategory(null);
      setShowDialog(false);
    }
  };

  return (
    <>
      <button
        onClick={() => handleClick(0)}
        disabled={isLoading}
        aria-label="Export data"
        className="flex items-center gap-2 px-4 py-2 font-medium text-white
        bg-yellow-500 hover:bg-yellow-600
        rounded-lg shadow-md
        transform transition-all duration-200 hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
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
            <span>Form</span>
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
            
            <div className="space-y-2 py-2">
              <button
                onClick={() => handlessdExport()}
                disabled={loadingCategory !== null}
                className="w-full py-3 px-4 text-left text-sm 
                  bg-white hover:bg-gray-50
                  rounded-lg transition-colors flex items-center justify-between
                  text-gray-700 hover:text-gray-900
                  border border-gray-200 hover:border-gray-300
                  disabled:opacity-50"
              >
                <span className="flex-1">SSD</span>
                {loadingCategory === 1 ? (
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
                onClick={() => handleExport(2)}
                disabled={loadingCategory !== null}
                className="w-full py-3 px-4 text-left text-sm 
                  bg-white hover:bg-gray-50
                  rounded-lg transition-colors flex items-center justify-between
                  text-gray-700 hover:text-gray-900
                  border border-gray-200 hover:border-gray-300
                  disabled:opacity-50"
              >
                <span className="flex-1">內存</span>
                {loadingCategory === 2 ? (
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
                onClick={() => handleExport(0)}
                disabled={loadingCategory !== null}
                className="w-full py-3 px-4 text-left text-sm 
                  bg-white hover:bg-gray-50
                  rounded-lg transition-colors flex items-center justify-between
                  text-gray-700 hover:text-gray-900
                  border border-gray-200 hover:border-gray-300
                  disabled:opacity-50"
              >
                <span className="flex-1">吹鍚植球</span>
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
                onClick={() => handleCheckExport()}
                disabled={loadingCategory !== null}
                className="w-full py-3 px-4 text-left text-sm 
                  bg-white hover:bg-gray-50
                  rounded-lg transition-colors flex items-center justify-between
                  text-gray-700 hover:text-gray-900
                  border border-gray-200 hover:border-gray-300
                  disabled:opacity-50"
              >
                <span className="flex-1">抽查表</span>
                {loadingCategory === 3 ? (
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