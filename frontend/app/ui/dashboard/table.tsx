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
    const newSortOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
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
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="hidden min-w-full text-gray-900 md:table table-fixed">
              <colgroup>
                <col className="w-[20px]"/>
                <col className="w-[100px]"/>
                <col className="w-[150px]"/>
                <col className="w-[150px]"/>
                <col className="w-[100px]"/>
                <col className="w-[150px]"/>
                <col className="w-[150px]"/>
                <col className="w-[150px]"/>
                <col className="w-[150px]"/>
                <col className="w-[80px]"/>
              </colgroup>
              <thead className="rounded-lg text-left text-sm font-medium sticky top-0 bg-white z-10 after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-gray-200">
                <tr>
                  <th scope="col" className="px-0 py-4">
                    <div className="flex items-center justify-center">
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="peer h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-4 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">ID</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('id')}
                      </div>
                  </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
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
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
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
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
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
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
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
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
                    onClick={() => handleSort('vender')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Vendor</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('vender')}
                      </div>
                    </div>
                </th>
                  <th 
                    scope="col" 
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
                    onClick={() => handleSort('client')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Client</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('client')}
                      </div>
                    </div>
                </th>
                  <th 
                    scope="col" 
                    className="px-3 py-4 font-medium cursor-pointer transition-colors hover:bg-gray-50 group"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-700">Category</span>
                      <div className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {renderSortIcon('category')}
                      </div>
                    </div>
                </th>
                  <th scope="col" className="px-3 py-4 font-medium">
                    Actions
                </th>
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-100">
              {products?.map((product) => (
                <tr
                    key={String(product.id)}
                    className="group relative transition-colors hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      // 防止點擊 checkbox 或編輯按鈕時觸發導航
                      const target = e.target as HTMLElement;
                      if (target.closest('input[type="checkbox"]') || target.closest('a')) {
                        return;
                      }
                      router.push(`/dashboard/${product.id}/edit`);
                    }}
                  >
                    <td className="whitespace-nowrap px-0 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <div className="relative w-5 h-5 flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="peer h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all duration-200"
                            checked={selectedRows.has(String(product.id))}
                            onChange={() => handleSelectRow(product.id)}
                          />
                        </div>
                    </div>
                  </td>
                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                      <p className="text-sm font-medium text-gray-900">{product.id}</p>
                    </td>
                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-700">{product.number}</p>
                    </div>
                  </td>
                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                      <p className="text-sm text-gray-700">{product.barcode}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="text-sm font-medium text-gray-900">{product.qty}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="text-sm text-gray-700">{product.date}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="text-sm text-gray-700">{product.vender}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="text-sm text-gray-700">{product.client}</span>
                  </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <span className="text-sm text-gray-700">{product.category}</span>
                  </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex justify-center">
                        <Link
                          href={`/dashboard/${product.id}/edit`}
                          className="
                            inline-flex items-center justify-center
                            rounded-lg p-2
                            text-blue-600 
                            hover:bg-blue-100 hover:text-blue-800
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                            transform transition-all duration-200
                            hover:scale-105
                            group
                          "
                          title="Edit Product"
                        >
                          <PencilIcon className="w-5 h-5 transition-colors" />
                          <span className="ml-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit
                          </span>
                        </Link>
                    </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}