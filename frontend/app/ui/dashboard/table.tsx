"use client"

import Image from 'next/image';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
//import { UpdateProduct, DeleteProduct } from '@/app/ui/dashboard/buttons';
import InvoiceStatus from '@/app/ui/invoices/status';
import { formatDateToLocal, formatCurrency } from '@/app/lib/utils';
import { getProducts, fetchProductsTotalPage } from '@/app/lib/data';
import { Product } from "@/interface/IDatatable"
//import { updateProduct } from '@/app/lib/actions';
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { deleteProducts } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PencilIcon } from '@heroicons/react/24/outline';

// Create a context for the delete message
export const DeleteMessageContext = createContext<{
  deleteMessage: string | null;
  setDeleteMessage: (message: string | null) => void;
  isMessageVisible: boolean;
  setIsMessageVisible: (visible: boolean) => void;
}>({
  deleteMessage: null,
  setDeleteMessage: () => {},
  isMessageVisible: false,
  setIsMessageVisible: () => {},
});

// Provider component for the delete message
export function DeleteMessageProvider({ children }: { children: React.ReactNode }) {
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  // Handle message display and auto-hide after 5 seconds
  useEffect(() => {
    if (deleteMessage) {
      setIsMessageVisible(true);
      const timer = setTimeout(() => {
        setIsMessageVisible(false);
        setTimeout(() => {
          setDeleteMessage(null);
        }, 500); // Wait for fade out animation to complete
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [deleteMessage]);

  return (
    <DeleteMessageContext.Provider value={{ deleteMessage, setDeleteMessage, isMessageVisible, setIsMessageVisible }}>
      {children}
    </DeleteMessageContext.Provider>
  );
}

// Hook to use the delete message context
export function useDeleteMessage() {
  return useContext(DeleteMessageContext);
}

// Component to display the delete message
export function DeleteMessage() {
  const { deleteMessage, isMessageVisible } = useDeleteMessage();

  if (!deleteMessage) return null;

  return (
    <div 
      className={`ml-4 p-2 rounded-md transition-opacity duration-500 ${
        isMessageVisible ? 'opacity-100' : 'opacity-0'
      } ${
        deleteMessage.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {deleteMessage}
    </div>
  );
}

// Helper function to dispatch selected items changed event
const notifySelectedItemsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('selectedItemsChanged'));
  }
};

export default function ProductsTable({
  initialProducts,
  query,
  currentPage,
}: {
  initialProducts: Product[];
  query: string;
  currentPage: number;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [allProductIds, setAllProductIds] = useState<string[]>([]);
  const { setDeleteMessage } = useDeleteMessage();
  const initialLoadRef = useRef(true);
  const prevSelectedRowsRef = useRef<string[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogContent, setNoteDialogContent] = useState<string>('');
  // 新增照片 Dialog 狀態
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoDialogPhotos, setPhotoDialogPhotos] = useState<string[]>([]);

  // Fetch initial products and total pages
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fetchedProducts, total] = await Promise.all([
          getProducts(query, currentPage),
          fetchProductsTotalPage(query),
        ]);
        setProducts(fetchedProducts);
        setTotalPages(total);
        // --- 快取所有產品到 localStorage，key 為 string，且每個 product 必有 current_status ---
        if (Array.isArray(fetchedProducts)) {
          const map: Record<string, any> = {};
          fetchedProducts.forEach((prod) => {
            // 若 current_status 缺失，預設為 '0'（可依實際需求調整）
            map[String(prod.id)] = {
              ...prod,
              current_status: prod.current_status !== undefined && prod.current_status !== null ? prod.current_status : '0',
            };
          });
          try {
            localStorage.setItem('allProductsMap', JSON.stringify(map));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[ProductsTable] Failed to cache allProductsMap:', e);
          }
        }
        // -------------------------------------------------------------
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchInitialData();
  }, [query, currentPage]); // Re-fetch when query or currentPage changes

  // Initialize selected rows from localStorage and listen for external changes
  useEffect(() => {
    try {
      const storedSelectedIds = JSON.parse(localStorage.getItem('selectedProductIds') || '[]');
      setSelectedRows(new Set(storedSelectedIds));
      prevSelectedRowsRef.current = storedSelectedIds;
    } catch (error) {
      console.error('Error loading selected rows from localStorage:', error);
      setSelectedRows(new Set());
    }

    const handleExternalChange = (event: Event) => {
      if ((event as CustomEvent)?.detail?.source !== 'table') {
        try {
          const storedSelectedIds = JSON.parse(localStorage.getItem('selectedProductIds') || '[]');
          setSelectedRows(new Set(storedSelectedIds));
          setSelectAll(false);
        } catch (error) {
          console.error('Error loading selected rows from localStorage:', error);
          setSelectedRows(new Set());
        }
      }
    };

    window.addEventListener('selectedItemsChanged', handleExternalChange);

    return () => {
      window.removeEventListener('selectedItemsChanged', handleExternalChange);
    };
  }, []);

  // Update localStorage when selected rows change
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    const currentSelectedRows = Array.from(selectedRows);
    const prevSelectedRows = prevSelectedRowsRef.current;

    if (JSON.stringify(currentSelectedRows) !== JSON.stringify(prevSelectedRows)) {
      try {
        localStorage.setItem('selectedProductIds', JSON.stringify(currentSelectedRows));
        prevSelectedRowsRef.current = currentSelectedRows;

        const event = new CustomEvent('selectedItemsChanged', {
          detail: { source: 'table' }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error saving selected rows to localStorage:', error);
      }
    }
  }, [selectedRows]);

  // Refresh products after deletion (via selectedItemsChanged event)
  useEffect(() => {
    const handleDeletionRefresh = async () => {
      try {
        const [fetchedProducts, total] = await Promise.all([
          getProducts(query, currentPage),
          fetchProductsTotalPage(query),
        ]);
        setProducts(fetchedProducts);
        setTotalPages(total);
        // --- 快取所有產品到 localStorage，key 為 string，且每個 product 必有 current_status ---
        if (Array.isArray(fetchedProducts)) {
          const map: Record<string, any> = {};
          fetchedProducts.forEach((prod) => {
            map[String(prod.id)] = {
              ...prod,
              current_status: prod.current_status !== undefined && prod.current_status !== null ? prod.current_status : '0',
            };
          });
          try {
            localStorage.setItem('allProductsMap', JSON.stringify(map));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[ProductsTable] Failed to cache allProductsMap:', e);
          }
        }
        // -------------------------------------------------------------
      } catch (error) {
        console.error('Failed to refresh products after deletion:', error);
      }
    };
    const handleSelectedItemsChanged = () => {
      handleDeletionRefresh();
    };
    // Listen for selectedItemsChanged event from DeleteButton
    window.addEventListener('selectedItemsChanged', handleSelectedItemsChanged);
    return () => {
      window.removeEventListener('selectedItemsChanged', handleSelectedItemsChanged);
    };
  }, [query, currentPage]); // Dependencies ensure re-fetch respects current query/page

  // Fetch all product IDs for select all
  const fetchAllProductIds = async () => {
  
    try {
      const allIds: string[] = [];
      for (let page = 1; page <= totalPages; page++) {
        const pageProducts = await getProducts(query, page);
        const pageIds = pageProducts.map((product) => String(product.id));
        allIds.push(...pageIds);
      }
      setAllProductIds(allIds);
      return allIds;
    } catch (error) {
      console.error('Failed to fetch all product IDs:', error);
      return [];
    } 
  };

  // Handle select all checkbox
  const handleSelectAll = async () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const ids = await fetchAllProductIds();
      setSelectedRows(new Set(ids));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual row selection
  const handleSelectRow = (id: bigint | string) => {
    const stringId = String(id);
    const newSelectedRows = new Set(selectedRows);

    if (newSelectedRows.has(stringId)) {
      newSelectedRows.delete(stringId);
    } else {
      newSelectedRows.add(stringId);
    }

    setSelectedRows(newSelectedRows);
    setSelectAll(false);
  };

  // Handle sorting
  const handleSort = async (field: string) => {
    let newSortOrder: 'asc' | 'desc' = 'asc';
    // Status 欄位特別處理，讓 "入庫"(1) 在前面
    if (field === 'current_status') {
      newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
      setSortField(field);
      setSortOrder(newSortOrder);
      try {
        // 讓 current_status=1(入庫) 在 asc 時排最前面
        const sortedProducts = [...products].sort((a, b) => {
          const aVal = a.current_status === '1' ? 0 : 1;
          const bVal = b.current_status === '1' ? 0 : 1;
          return newSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
        setProducts(sortedProducts);
      } catch (error) {
        console.error('Failed to sort products:', error);
      }
      return;
    }

    newSortOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    try {
      const sortedProducts = await getProducts(query, currentPage, field, newSortOrder);
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Failed to sort products:', error);
    }
  };

  // 渲染排序圖標
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  };

  // 添加對分頁變化的監聽
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedProducts, total] = await Promise.all([
          getProducts(query, currentPage, sortField, sortOrder),
          fetchProductsTotalPage(query),
        ]);
        setProducts(fetchedProducts);
        setTotalPages(total);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchData();
  }, [query, currentPage, sortField, sortOrder]); // 添加分頁依賴

  return (
    <div className="mt-6 flow-root">
      {/* Note Dialog */}
      {noteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setNoteDialogOpen(false)}
              aria-label="關閉"
            >
              ×
            </button>
            <div className="text-base font-semibold mb-2 text-gray-800">備註內容</div>
            <div className="text-sm text-gray-700 whitespace-pre-line break-words max-h-80 overflow-y-auto">
              {noteDialogContent || '無備註'}
            </div>
          </div>
        </div>
      )}
      {/* Photo Dialog */}
      {photoDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setPhotoDialogOpen(false)}
              aria-label="關閉"
            >
              ×
            </button>
            <div className="text-base font-semibold mb-4 text-gray-800">產品照片</div>
            {photoDialogPhotos.length === 0 ? (
              <div className="text-gray-500 text-center">無照片</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                {photoDialogPhotos.map((url, idx) => (
                  <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg shadow p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`photo-${idx}`}
                      className="object-contain rounded-lg border border-gray-200 shadow-md max-h-64 max-w-full mb-2"
                      style={{ width: '100%', height: '260px', background: '#f3f4f6' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="hidden min-w-full text-gray-900 md:table table-fixed">
              <colgroup>
                <col className="w-[36px]"/>
                <col className="w-[80px]"/>
                <col className="w-[150px]"/>
                <col className="w-[150px]"/>
                <col className="w-[150px]"/>
                <col className="w-[80px]"/>
                <col className="w-[80px]"/>
                <col className="w-[100px]"/>
                <col className="w-[100px]"/>
                <col className="w-[100px]"/>
                <col className="w-[100px]"/>
                <col className="w-[100px]"/>
                <col className="w-[100px]"/>
              </colgroup>
              <thead className="rounded-lg text-left text-base font-semibold sticky top-0 bg-white z-10 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gray-200">
                <tr>
                  <th scope="col" className="px-2 py-5">
                    <div className="flex items-center justify-center">
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          style={{ boxShadow: '0 1px 3px 0 #e5e7eb' }}
                        />
                      </div>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">ID</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('id')}
                      </div>
                  </div>
                  </th>
                  <th scope="col" className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap" onClick={() => handleSort('so_number')}>
                    <div className="flex items-center">
                      <span className="text-gray-700">SO Number</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('so_number')}
                </div>
                  </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Number</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('number')}
                </div>
                  </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('barcode')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Barcode</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('barcode')}
                  </div>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('qty')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Qty</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('qty')}
                </div>
              </div>
                </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('weight')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Weight</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('weight')}
                </div>
              </div>
                </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Date</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('date')}
                      </div>
                    </div>
                </th>
                  <th 
                    scope="col" 
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('ex_date')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Ship Date</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('ex_date')}
                      </div>
                    </div>
                </th>
                  <th
                    scope="col"
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('current_status')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Status</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('current_status')}
                      </div>
                    </div>
                  </th>
                  {/* 新增使用者欄位 */}
                  <th
                    scope="col"
                    className="px-4 py-5 font-semibold cursor-pointer transition-colors hover:bg-gray-50 group whitespace-nowrap"
                    onClick={() => handleSort('created_by_username')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Username</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('created_by_username')}
                      </div>
                    </div>
                  </th>
                  {/* 新增照片欄位 */}
                  <th scope="col" className="px-4 py-5 font-semibold whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-gray-700">Photo</span>
                    </div>
                  </th>
                  <th scope="col" className="px-4 py-5 font-semibold whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-gray-700">Note</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[15px]">
              {products?.map((product) => {
                // 移除原本 showNote state，改用 Dialog 控制
                return (
                  <tr
                    key={String(product.id)}
                    className="group relative transition-colors hover:bg-blue-50 cursor-pointer"
                    style={{ height: '60px' }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('input[type="checkbox"]') || target.closest('button[data-note]')) {
                        return;
                      }
                      router.push(`/dashboard/${product.id}/edit`);
                    }}
                  >
                    <td className="whitespace-nowrap px-2 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <div className="relative w-5 h-5 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="peer h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                            checked={selectedRows.has(String(product.id))}
                            onChange={() => handleSelectRow(product.id)}
                            style={{ boxShadow: '0 1px 3px 0 #e5e7eb' }}
                          />
                        </div>
                    </div>
                  </td>
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-[15px] text-gray-700">
                      {product.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] font-semibold text-blue-700 bg-blue-50 rounded-lg shadow-sm border border-blue-100">
                      {product.so_number}
                    </td>
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-[15px] text-gray-700">
                      <div className="flex items-center gap-3">
                        {product.number}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-[15px] text-gray-700">
                      {product.barcode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-gray-700">
                      {product.qty}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-gray-700">
                      {product.weight}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-gray-700">
                      {product.date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-gray-700">
                      {product.ex_date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] font-bold rounded-lg shadow-sm border border-green-200"
                      style={{ color: product.current_status === '0' ? '#15803d' : product.current_status === '1' ? '#b91c1c' : '#0f172a', background: product.current_status === '0' ? '#dcfce7' : product.current_status === '1' ? '#fee2e2' : '#f1f5f9' }}>
                      {product.current_status === '0' ? '入庫' : product.current_status === '1' ? '出貨' : product.current_status}
                    </td>
                    {/* 使用者欄位 */}
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-gray-700">
                      {product.created_by_username || 'Unknown'}
                    </td>
                    {/* 照片欄位 */}
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-blue-600">
                      {Array.isArray(product.photos) && product.photos.length > 0 && ((typeof product.photos[0] === 'string' && product.photos[0]) || (typeof product.photos[0] === 'object' && Object.keys(product.photos[0]).length > 0)) ? (
                        <button
                          data-photo
                          className="underline hover:text-blue-800 focus:outline-none px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          onClick={e => {
                            e.stopPropagation();
                            let photoUrls: string[] = [];
                            if (typeof product.photos[0] === 'string') {
                              photoUrls = product.photos as unknown as string[];
                            } else if (typeof product.photos[0] === 'object') {
                              photoUrls = (product.photos as unknown as Record<string, any>[]) 
                                .map(p => p.url || p.path || p.image || p.src || p.file || '')
                                .filter((url): url is string => typeof url === 'string' && url.length > 0);
                            }
                            setPhotoDialogPhotos(photoUrls);
                            setPhotoDialogOpen(true);
                          }}
                        >
                          Show
                        </button>
                      ) : null}
                    </td>
                    {/* 備註欄位 */}
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-blue-600">
                      {product.noted && product.noted.trim() !== '' ? (
                        <button
                          data-note
                          className="underline hover:text-blue-800 focus:outline-none px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          onClick={e => {
                            e.stopPropagation();
                            setNoteDialogContent(product.noted || '');
                            setNoteDialogOpen(true);
                          }}
                        >
                          Show
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}