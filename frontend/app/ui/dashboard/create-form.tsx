"use client"
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createProduct } from '@/app/lib/actions';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import Dialog from '@/app/ui/dialog';

// Define Product type for our temporary products
interface TempProduct {
  id: string;
  number: string;
  barcode: string;
  qty: string;
  date: string;
  vender: string;
  client: string;
  category: string;
}

export default function Form() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [number, setNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [qty, setQty] = useState('');
  const [date, setDate] = useState(searchParams.get('query') || '');
  const [vender, setVender] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('0'); // 設定預設值為 '0'
  const [dateError, setDateError] = useState('');
  
  // Add state for temporary products
  const [tempProducts, setTempProducts] = useState<TempProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle date change and update URL
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Format: YYYY-MM-DD
    setDate(value);

    if (!value) {
      setDateError('Date is required');
      return; // Don't update URL if empty
    } else {
      setDateError(''); // Clear error if valid
    }

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('query', value);
    } else {
      params.delete('query');
    }
    router.push(`?${params.toString()}`);
  };

  // Handle vender change and update URL
  const handleVenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVender(value);

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('vender', value);
    } else {
      params.delete('vender');
    }
    router.push(`?${params.toString()}`);
  };

  // Handle client change and update URL
  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClient(value);

    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('client', value);
    } else {
      params.delete('client');
    }
    router.push(`?${params.toString()}`);
  };

  // Function to clear form fields
  const clearForm = () => {
    setNumber('');
    setBarcode('');
    setQty('');
    // Keep vender, client and date as is for convenience
    setCategory('0');
  };

  // Function to add product to temporary list
  const handleAddProduct = () => {
    // Validate required fields
    if (!barcode || !date) {
      if (!barcode) alert('Barcode is required');
      if (!date) setDateError('Date is required');
      return;
    }

    // Create a temporary product
    const newProduct: TempProduct = {
      id: Date.now().toString(), // Temporary ID for list management
      number,
      barcode,
      qty,
      date,
      vender,
      client,
      category
    };

    // Add to temporary products
    setTempProducts([...tempProducts, newProduct]);
    
    // Clear form for next entry
    clearForm();
  };

  // Function to remove a product from temporary list
  const handleRemoveProduct = (id: string) => {
    setTempProducts(tempProducts.filter(product => product.id !== id));
  };

  // Get category name by value
  const getCategoryName = (value: string) => {
    switch(value) {
      case '0': return 'Normal';
      case '1': return '大顆SSD';
      case '2': return 'Ram';
      case '3': return '小顆SSD';
      default: return 'Unknown';
    }
  };

  const getSSDCount = () => {
    return tempProducts.filter(product => 
      product.category === '1' || product.category === '3'
    ).length;
  };

  const getRAMCount = () => {
    return tempProducts.filter(product => 
      product.category === '2'
    ).length;
  };

  const initialState = { message: null, errors: {} };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tempProducts.length === 0) {
      alert('Please add at least one product');
      return;
    }

    // Show confirmation dialog instead of window.confirm
    setShowConfirmDialog(true);
  };

  // New function to handle actual submission
  const handleConfirmedSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    
    try {
      // Create all products one by one
      const results = await Promise.all(
        tempProducts.map(async (product) => {
          const formData = new FormData();
          formData.append('number', product.number);
          formData.append('barcode', product.barcode);
          formData.append('qty', product.qty);
          formData.append('date', product.date);
          formData.append('vender', product.vender);
          formData.append('client', product.client);
          formData.append('category', product.category);
          
          return await createProduct(formData);
        })
      );
      
      // Check if all products were created successfully
      const allSuccessful = results.every(result => result && result.success);
      
      if (allSuccessful) {
        // Redirect to the dashboard on successful product creation
        router.push('/dashboard');
      } else {
        // Handle errors if needed
        console.error('Failed to create some products:', results.filter(r => !r.success).map(r => r.message));
        alert('Failed to create some products. Please check the console for details.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-9xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Temporary Products List */}
          <div className="rounded-lg bg-white shadow-md p-8 md:p-10 border border-gray-100 xl:col-span-1">
            <div className="flex items-center justify-between space-x-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>List</h1>
              </div>
              {tempProducts.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setTempProducts([])}
                  className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {tempProducts.length === 0 ? (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <PlusIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No products added yet</p>
                <p className="text-sm text-gray-400">Fill the form and click "Add" to begin creating products</p>
              </div>
            ) : (
              <div className="h-[500px] overflow-y-auto rounded border border-gray-200 shadow-inner">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap text-center">Actions</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Number</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Barcode</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Qty</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Date</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Vendor</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Client</th>
                      <th scope="col" className="px-4 py-3 whitespace-nowrap">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempProducts.map((product) => (
                      <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                            title="Remove product"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                        <td className="px-4 py-3 max-w-[120px] truncate">{product.number || '-'}</td>
                        <td className="px-4 py-3 max-w-[120px] truncate">{product.barcode}</td>
                        <td className="px-4 py-3">{product.qty || '0'}</td>
                        <td className="px-4 py-3">{product.date}</td>
                        <td className="px-4 py-3 max-w-[120px] truncate">{product.vender || '-'}</td>
                        <td className="px-4 py-3 max-w-[120px] truncate">{product.client || '-'}</td>
                        <td className="px-4 py-3">{getCategoryName(product.category)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Replace the summary section */}
            {tempProducts.length > 0 && (
              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border-r border-blue-200">
                    <span className="block text-xs text-gray-500">Total</span>
                    <span className="font-semibold">{tempProducts.length}</span>
                  </div>
                  <div className="border-r border-blue-200">
                    <span className="block text-xs text-gray-500">SSD</span>
                    <span className="font-semibold">{getSSDCount()}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">RAM</span>
                    <span className="font-semibold">{getRAMCount()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Section */}
          <div className="rounded-lg bg-white shadow-md p-8 md:p-10 border border-gray-100 order-first xl:order-none xl:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <PencilSquareIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>Add New Product</h1>
              </div>
              <button 
                type="button"
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add to List</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Number */}
              <div className="mb-4">
                <label htmlFor="number" className="mb-3 block text-base font-medium text-gray-700">
                  Number
                </label>
                <div className="relative">
                  <input
                    id="number"
                    name="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="peer block w-full cursor-pointer rounded-md border border-gray-300 py-3 pl-12 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter product number"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-[24px] w-[24px] -translate-y-1/2 text-gray-500 size-6">
                    <path fillRule="evenodd" d="M7.491 5.992a.75.75 0 0 1 .75-.75h12a.75.75 0 1 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM7.49 11.995a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM7.491 17.994a.75.75 0 0 1 .75-.75h12a.75.75 0 1 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.24 3.745a.75.75 0 0 1 .75-.75h1.125a.75.75 0 0 1 .75.75v3h.375a.75.75 0 0 1 0 1.5H2.99a.75.75 0 0 1 0-1.5h.375v-2.25H2.99a.75.75 0 0 1-.75-.75ZM2.79 10.602a.75.75 0 0 1 0-1.06 1.875 1.875 0 1 1 2.652 2.651l-.55.55h.35a.75.75 0 0 1 0 1.5h-2.16a.75.75 0 0 1-.53-1.281l1.83-1.83a.375.375 0 0 0-.53-.53.75.75 0 0 1-1.062 0ZM2.24 15.745a.75.75 0 0 1 .75-.75h1.125a1.875 1.875 0 0 1 1.501 2.999 1.875 1.875 0 0 1-1.501 3H2.99a.75.75 0 0 1 0-1.501h1.125a.375.375 0 0 0 .036-.748H3.74a.75.75 0 0 1-.75-.75v-.002a.75.75 0 0 1 .75-.75h.411a.375.375 0 0 0-.036-.748H2.99a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Barcode */}
              <div className="mb-4">
                <label htmlFor="barcode" className="mb-3 block text-base font-medium text-gray-700">
                  Barcode
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    id="barcode"
                    name="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="peer block w-full rounded-md border border-gray-300 py-3 pl-12 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter barcode"
                    required={tempProducts.length === 0}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-[24px] w-[24px] -translate-y-1/2 text-gray-500 size-6">
                    <path fillRule="evenodd" d="M7.491 5.992a.75.75 0 0 1 .75-.75h12a.75.75 0 1 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM7.49 11.995a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM7.491 17.994a.75.75 0 0 1 .75-.75h12a.75.75 0 1 1 0 1.5h-12a.75.75 0 0 1-.75-.75ZM2.24 3.745a.75.75 0 0 1 .75-.75h1.125a.75.75 0 0 1 .75.75v3h.375a.75.75 0 0 1 0 1.5H2.99a.75.75 0 0 1 0-1.5h.375v-2.25H2.99a.75.75 0 0 1-.75-.75ZM2.79 10.602a.75.75 0 0 1 0-1.06 1.875 1.875 0 1 1 2.652 2.651l-.55.55h.35a.75.75 0 0 1 0 1.5h-2.16a.75.75 0 0 1-.53-1.281l1.83-1.83a.375.375 0 0 0-.53-.53.75.75 0 0 1-1.062 0ZM2.24 15.745a.75.75 0 0 1 .75-.75h1.125a1.875 1.875 0 0 1 1.501 2.999 1.875 1.875 0 0 1-1.501 3H2.99a.75.75 0 0 1 0-1.501h1.125a.375.375 0 0 0 .036-.748H3.74a.75.75 0 0 1-.75-.75v-.002a.75.75 0 0 1 .75-.75h.411a.375.375 0 0 0-.036-.748H2.99a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Qty */}
              <div className="mb-4">
                <label htmlFor="qty" className="mb-3 block text-base font-medium text-gray-700">
                  Quantity
                </label>
                <div className="relative">
                  <input
                    id="qty"
                    name="qty"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="peer block w-full rounded-md border border-gray-300 py-3 pl-12 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter quantity"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-[24px] w-[24px] -translate-y-1/2 text-gray-500 size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </div>
              </div>

              {/* Date (Required) */}
              <div className="mb-4">
                <label htmlFor="date" className="mb-3 block text-base font-medium text-gray-700">
                  Date
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={date}
                    required={tempProducts.length === 0}
                    onChange={handleDateChange}
                    className="peer block w-full rounded-md border border-gray-300 py-3 pl-4 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="ml-3 rounded-md bg-blue-500 px-4 py-3 text-white hover:bg-blue-600 transition-colors text-base font-medium"
                  >
                    Today
                  </button>
                </div>
                {dateError && (
                <p className="mt-2 text-base text-red-500">{dateError}</p>
                )}
              </div>

              {/* Vender */}
              <div className="mb-4">
                <label htmlFor="vender" className="mb-3 block text-base font-medium text-gray-700">
                  Vendor
                </label>
                <div className="relative">
                  <input
                    id="vender"
                    name="vender"
                    value={vender}
                    onChange={handleVenderChange}
                    className="peer block w-full rounded-md border border-gray-300 py-3 pl-12 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter vendor name"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-[24px] w-[24px] -translate-y-1/2 text-gray-500 size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
              </div>

              {/* Client */}
              <div className="mb-4">
                <label htmlFor="client" className="mb-3 block text-base font-medium text-gray-700">
                  Client
                </label>
                <div className="relative">
                  <input
                    id="client"
                    name="client"
                    value={client}
                    onChange={handleClientChange}
                    className="peer block w-full rounded-md border border-gray-300 py-3 pl-12 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="Enter client name"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-[24px] w-[24px] -translate-y-1/2 text-gray-500 size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
              </div>

              {/* Category */}
              <div className="mb-4 md:col-span-2">
                <label htmlFor="category" className="mb-3 block text-base font-medium text-gray-700">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="peer block w-full rounded-md border border-gray-300 py-3 pl-12 text-base outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="0"> 0: Normal</option>
                    <option value="1"> 1: 大顆SSD</option>
                    <option value="2"> 2: Ram</option>
                    <option value="3"> 3: 小顆SSD </option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-[24px] w-[24px] -translate-y-1/2 text-gray-500 size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-10 flex flex-col sm:flex-row sm:justify-end gap-4">
          <Link
            href="/dashboard"
            className="flex h-10 sm:h-12 items-center justify-center rounded-lg bg-gray-100 px-8 text-base font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Back to Dashboard
          </Link>
          
          <Button 
            type="submit" 
            className={`flex h-10 sm:h-12 items-center justify-center gap-2 px-8 text-base font-medium transition-all duration-200 ${
              isSubmitting || tempProducts.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isSubmitting || tempProducts.length === 0}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : tempProducts.length > 0 ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Create {tempProducts.length} Product{tempProducts.length !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <span>Add Products to Continue</span>
            )}
          </Button>
        </div>
      </form>

      {/* Add Confirmation Dialog */}
      <Dialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmedSubmit}
        title="確認創建產品"
      >
        <div className="space-y-4">
          <p className="text-gray-500">
            您確定要創建以下產品嗎？
          </p>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">總數：</span>
              <span className="font-medium">{tempProducts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SSD：</span>
              <span className="font-medium">{getSSDCount()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">RAM：</span>
              <span className="font-medium">{getRAMCount()}</span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
