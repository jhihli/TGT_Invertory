
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProducts, batchUpdateProductStatus } from '@/app/lib/actions';
import { useDeleteMessage } from './table';

// 新增: 批次狀態更新 action
export function DeleteButton() {
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'inbound' | 'outbound' | null }>({ open: false, action: null });
  // 處理確認對話框的確認
  const handleConfirm = async () => {
    setConfirmDialog({ open: false, action: null });
    if (confirmDialog.action === 'inbound') {
      await handleBatchStatus('0');
    } else if (confirmDialog.action === 'outbound') {
      await handleBatchStatus('1');
    }
  };
  // 處理取消
  const handleCancel = () => {
    setConfirmDialog({ open: false, action: null });
  };
  // 顯示確認對話框
  const handleShowConfirm = (action: 'inbound' | 'outbound') => {
    setConfirmDialog({ open: true, action });
  };
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<'0' | '1' | 'mixed' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { setDeleteMessage } = useDeleteMessage();

  // 取得選取的產品 IDs 與其 current_status
  const updateSelectedInfo = () => {
    try {
      const storedItems = localStorage.getItem('selectedProductIds');
      let selectedItems: string[] = [];
      if (!storedItems) {
        localStorage.setItem('selectedProductIds', '[]');
        setSelectedCount(0);
        setSelectedStatus(null);
        return;
      }
      try {
        selectedItems = JSON.parse(storedItems);
      } catch (parseError) {
        localStorage.setItem('selectedProductIds', '[]');
        setSelectedCount(0);
        setSelectedStatus(null);
        return;
      }
      if (!Array.isArray(selectedItems)) {
        localStorage.setItem('selectedProductIds', '[]');
        setSelectedCount(0);
        setSelectedStatus(null);
        return;
      }
      setSelectedCount(selectedItems.length || 0);
      // 取得所有選取產品的 current_status
      if (selectedItems.length === 0) {
        setSelectedStatus(null);
        return;
      }
      // 從 localStorage 取得所有產品的狀態 (假設有快取, 否則需 API 查詢)
      let allProductsMap: Record<string, any> = {};
      const allProductsRaw = localStorage.getItem('allProductsMap');
      if (allProductsRaw) {
        try {
          // 強制所有 key 為 string，且每個 product 必須有 current_status
          const parsed = JSON.parse(allProductsRaw);
          allProductsMap = Object.fromEntries(
            Object.entries(parsed).map(([k, v]) => {
              if (typeof v === 'object' && v !== null) {
                return [String(k), { ...v, current_status: (v as any).current_status ?? null }];
              } else {
                return [String(k), { current_status: null }];
              }
            })
          );
          // 若有任何 product 沒有 current_status，直接清掉 localStorage 以避免髒資料
          const hasInvalid = Object.values(allProductsMap).some(
            (prod: any) => prod.current_status === null || prod.current_status === undefined
          );
          if (hasInvalid) {
            // eslint-disable-next-line no-console
            console.warn('[DeleteButton] allProductsMap contains product(s) with missing current_status, clearing cache');
            localStorage.removeItem('allProductsMap');
            setSelectedStatus('mixed');
            return;
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[DeleteButton] Failed to parse allProductsMap:', e);
          localStorage.removeItem('allProductsMap');
          setSelectedStatus('mixed');
          return;
        }
      }
      // Debug: 印出選取資料 row 資訊與 current_status，並顯示 id 型別與 allProductsMap 的所有 key
      const allMapKeys = Object.keys(allProductsMap);
      const selectedRowsInfo = selectedItems.map(id => {
        const prod = allProductsMap[String(id)];
        return {
          id,
          idType: typeof id,
          mapKeyExists: Object.prototype.hasOwnProperty.call(allProductsMap, String(id)),
          current_status: prod && Object.prototype.hasOwnProperty.call(prod, 'current_status') ? prod.current_status : null,
          prod
        };
      });
      // eslint-disable-next-line no-console
      console.log('[DeleteButton] allProductsMap keys:', allMapKeys);
      // eslint-disable-next-line no-console
      console.log('[DeleteButton] selected rows:', selectedRowsInfo);
      // 修正: 若 allProductsMap 沒有資料，直接 fallback 為 mixed，並提示
      if (!allProductsMap || Object.keys(allProductsMap).length === 0) {
        setSelectedStatus('mixed');
        return;
      }
      const statuses = selectedItems.map(id => {
        const prod = allProductsMap[String(id)];
        if (!prod || prod.current_status === undefined || prod.current_status === null) return 'mixed';
        if (prod.current_status === '0' || prod.current_status === 0) return '0';
        if (prod.current_status === '1' || prod.current_status === 1) return '1';
        return 'mixed';
      }) as Array<'0' | '1' | 'mixed'>;
      // 若有任何一個是 mixed，則視為混合
      if (statuses.includes('mixed')) {
        setSelectedStatus('mixed');
        return;
      }
      // 修正: unique 可能為空陣列時避免錯誤
      const unique = Array.from(new Set(statuses)).filter(v => v === '0' || v === '1') as Array<'0' | '1'>;
      if (unique.length === 1) {
        setSelectedStatus(unique[0]);
      } else {
        setSelectedStatus('mixed');
      }
    } catch {
      setSelectedCount(0);
      setSelectedStatus(null);
    }
  };

  useEffect(() => {
    updateSelectedInfo();
    const handleStorageChange = () => updateSelectedInfo();
    const handleSelectedItemsChanged = () => updateSelectedInfo();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('selectedItemsChanged', handleSelectedItemsChanged);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('selectedItemsChanged', handleSelectedItemsChanged);
    };
  }, []);

  // 批次刪除
  const handleDeleteSelected = async () => {
    if (selectedCount === 0) return;
    setIsProcessing(true);
    try {
      const storedItems = localStorage.getItem('selectedProductIds');
      let selectedIds: string[] = [];
      if (!storedItems) {
        setIsProcessing(false);
        return;
      }
      try {
        selectedIds = JSON.parse(storedItems);
      } catch {
        setDeleteMessage('Invalid selection data, please try again');
        setIsProcessing(false);
        return;
      }
      if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
        setIsProcessing(false);
        return;
      }
      const result = await deleteProducts(selectedIds);
      if (result.success) {
        localStorage.setItem('selectedProductIds', '[]');
        const event = new CustomEvent('selectedItemsChanged', { detail: { source: 'deleteButton' } });
        window.dispatchEvent(event);
        setDeleteMessage(result.message);
        router.refresh();
      } else {
        setDeleteMessage(result.message);
      }
    } catch (error) {
      setDeleteMessage('An unexpected error occurred while deleting products');
    } finally {
      setIsProcessing(false);
    }
  };

  // 批次狀態更新
  const handleBatchStatus = async (targetStatus: '0' | '1') => {
    if (selectedCount === 0) return;
    setIsProcessing(true);
    try {
      const storedItems = localStorage.getItem('selectedProductIds');
      let selectedIds: string[] = [];
      if (!storedItems) {
        setIsProcessing(false);
        return;
      }
      try {
        selectedIds = JSON.parse(storedItems);
      } catch {
        setDeleteMessage('Invalid selection data, please try again');
        setIsProcessing(false);
        return;
      }
      if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
        setIsProcessing(false);
        return;
      }
        const today = new Date().toISOString().split('T')[0];
        const result = await batchUpdateProductStatus(selectedIds, targetStatus, today);
      if (result.success) {
        setDeleteMessage(result.message);
        // 清空選取
        localStorage.setItem('selectedProductIds', '[]');
        const event = new CustomEvent('selectedItemsChanged', { detail: { source: 'batchStatus' } });
        window.dispatchEvent(event);
        router.refresh();
      } else {
        setDeleteMessage(result.message);
      }
    } catch (error) {
      setDeleteMessage('An unexpected error occurred while updating status');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedCount === 0) return null;

  // 按鈕顯示邏輯
  return (
    <div className="flex gap-2">
      {/* 出貨: 只選 current_status==0 時顯示 */}
      {selectedStatus === '0' && (
        <button
          onClick={() => handleShowConfirm('outbound')}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded-md ${isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-blue-600'} px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          title="出貨"
        >
          <span>出貨</span>
        </button>
      )}
      {/* 入庫: 只選 current_status==1 時顯示 */}
      {selectedStatus === '1' && (
        <button
          onClick={() => handleShowConfirm('inbound')}
          disabled={isProcessing}
          className={`flex items-center gap-2 rounded-md ${isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
          title="入庫"
        >
          <span>入庫</span>
        </button>
      )}
      {/* 確認對話框 */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg max-w-xs w-full p-6 relative animate-fade-in">
            <div className="text-base font-semibold mb-2 text-gray-800">{confirmDialog.action === 'inbound' ? '確定要將選取的產品全部「入庫」嗎？' : '確定要將選取的產品全部「出貨」嗎？'}</div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                onClick={handleCancel}
                disabled={isProcessing}
              >取消</button>
              <button
                className={`px-4 py-2 rounded text-white ${confirmDialog.action === 'inbound' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleConfirm}
                disabled={isProcessing}
              >確定</button>
            </div>
          </div>
        </div>
      )}
      {/* 刪除: 任何狀態都顯示 */}
      <button
        onClick={handleDeleteSelected}
        disabled={isProcessing}
        className={`flex items-center gap-2 rounded-md ${isProcessing ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
        title={`Delete Selected (${selectedCount})`}
      >
        {isProcessing ? (
          <>
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>處理中...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Selected ({selectedCount})</span>
          </>
        )}
      </button>
    </div>
  );
}