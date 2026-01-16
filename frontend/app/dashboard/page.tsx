import Table from '@/app/ui/dashboard/table';
import { lusitana } from '@/app/ui/fonts';
import Pagination from '@/app/ui/dashboard/pagination';
import { ProductsTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchProductsTotalPage, getProducts, getAllProductsForExport } from '@/app/lib/data';
import { DeleteMessageProvider } from '@/app/ui/dashboard/table';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';
import ClientActionBar from '@/app/ui/dashboard/client-action-bar';

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().split('T')[0];
  // Use today's date as default only if no query param exists (first load)
  // If query param exists (even empty string), user has interacted - use their value
  const query = params?.query !== undefined ? params.query : today;
  let currentPage = Number(params?.page) || 1;
  let products: any[] = [];
  let All_products: any[] = [];

  try {
    const totalPages = await fetchProductsTotalPage(query);
    
    // 調整當前頁碼以確保在有效範圍內
    if (totalPages > 0) {
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
    } else {
      currentPage = 1;
    }

    products = await getProducts(query, currentPage);
    All_products = await getAllProductsForExport(query);

    return (
      <DeleteMessageProvider>
        <div className="w-full">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ArchiveBoxIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>
                  Inventory
                </h1>
              </div>
              <div className="flex space-x-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">總產品數</div>
                  <div className="text-2xl font-bold text-blue-700">{All_products.length}</div>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">SSD-大</div>
                  <div className="text-2xl font-bold text-green-700">{All_products.filter(p => p.category === '1').length}</div>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">SSD-顆</div>
                  <div className="text-2xl font-bold text-green-700">{All_products.filter(p => p.category === '3').length}</div>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium">RAM</div>
                  <div className="text-2xl font-bold text-purple-700">{All_products.filter(p => p.category === '2').length}</div>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">當前頁面</div>
                  <div className="text-2xl font-bold text-gray-700">{currentPage} / {totalPages || 1}</div>
                </div>
              </div>
            </div>
          </div>

          <ClientActionBar 
            query={query} 
            // currentPage={currentPage} 
            // products={products} 
          />

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Suspense fallback={<ProductsTableSkeleton />}>
              <Table initialProducts={products} query={query} currentPage={currentPage} />
            </Suspense>
          </div>

          {/* Pagination Section */}
          <div className="mt-4 flex justify-center">
            <Pagination totalPages={totalPages || 1} />
          </div>
        </div>
      </DeleteMessageProvider>
    );
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // 即使主要請求失敗，仍嘗試獲取所有產品的資料
    try {
      All_products = await getAllProductsForExport(query);
    } catch (innerError) {
      console.error('Error fetching all products:', innerError);
      All_products = [];
    }
    
    return (
      <DeleteMessageProvider>
        <div className="w-full">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ArchiveBoxIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>
                  Inventory
                </h1>
              </div>
              <div className="flex space-x-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">總產品數</div>
                  <div className="text-2xl font-bold text-blue-700">{All_products.length}</div>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">SSD</div>
                  <div className="text-2xl font-bold text-green-700">{All_products.filter(p => p.category === '1').length}</div>
                </div>
                <div className="bg-purple-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium">RAM</div>
                  <div className="text-2xl font-bold text-purple-700">{All_products.filter(p => p.category === '2').length}</div>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">當前頁面</div>
                  <div className="text-2xl font-bold text-gray-700">1 / 1</div>
                </div>
              </div>
            </div>
          </div>

          {/* <ClientActionBar query={query} currentPage={1} /> */}
          <ClientActionBar 
            query={query} 
          />
          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Suspense fallback={<ProductsTableSkeleton />}>
              <Table initialProducts={[]} query={query} currentPage={1} />
            </Suspense>
          </div>

          {/* Pagination Section */}
          <div className="mt-4 flex justify-center">
            <Pagination totalPages={1} />
          </div>
        </div>
      </DeleteMessageProvider>
    );
  }
}