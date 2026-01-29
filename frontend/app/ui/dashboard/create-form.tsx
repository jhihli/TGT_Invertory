"use client"
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createProduct } from '@/app/lib/actions';
import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import Dialog from '@/app/ui/dialog';
import { getCargos } from '@/app/lib/data';
import { Cargo } from '@/interface/IDatatable';
import SearchableSelect from '@/app/ui/SearchableSelect';

// 1. 擴充 TempProduct 型別
interface TempProduct {
  id: string;
  number: string;
  so_number: string;
  barcode: string;
  qty: string;
  weight: string;
  date: string;
  vender: string;
  client: string;
  category: string;
  current_status: string;
  noted: string;
  photos: File[];
  cargo?: string; // cargo ID
}

export default function Form() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const [numberItems, setNumberItems] = useState<{number: string, qty: string}[]>([{number: '', qty: ''}]);
  const [barcode, setBarcode] = useState('');
  const [date, setDate] = useState(searchParams.get('query') || '');
  const [vender, setVender] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('0'); // 設定預設值為 '0'
  const [dateError, setDateError] = useState('');
  const [photos, setPhotos] = useState<File[]>([]); // 新增
  const [so_number, setSoNumber] = useState(''); // 新增
  const [weight, setWeight] = useState(''); // 預設為空
  const [current_status, setCurrentStatus] = useState('0'); // current_status 預設為 0
  const [noted, setNoted] = useState('');
  const [soNumberError, setSoNumberError] = useState(''); // 新增
  const [cargo, setCargo] = useState(''); // 新增 cargo
  const [cargos, setCargos] = useState<Cargo[]>([]); // 新增 cargos list
  const [weightError, setWeightError] = useState(''); // 新增重量錯誤訊息

  // Add state for temporary products
  const [tempProducts, setTempProducts] = useState<TempProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<TempProduct | null>(null);

  // Fetch cargos on component mount
  useEffect(() => {
    const fetchCargos = async () => {
      const data = await getCargos();
      setCargos(data);
    };
    fetchCargos();
  }, []);

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

  // Handle weight change with validation
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      setWeight('');
      setWeightError('');
      return;
    }

    // Check if value is a valid number (allow decimals)
    if (!/^\d+\.?\d*$/.test(value)) {
      setWeightError('Weight must be a number');
      return;
    }

    // Remove leading zeros (e.g., '00222' becomes '222', '00.5' becomes '0.5')
    let cleanedValue = value;

    // If value starts with zeros followed by a decimal point, keep one zero (e.g., '00.5' -> '0.5')
    if (/^0+\./.test(value)) {
      cleanedValue = value.replace(/^0+/, '0');
    }
    // If value is all zeros followed by digits, remove leading zeros (e.g., '00222' -> '222')
    else if (/^0+\d/.test(value)) {
      cleanedValue = value.replace(/^0+/, '');
    }
    // If value is just zeros, keep one zero
    else if (/^0+$/.test(value)) {
      cleanedValue = '0';
    }

    setWeight(cleanedValue);
    setWeightError('');
  };

  // Handle adding a new number+qty item
  const handleAddNumberItem = () => {
    setNumberItems([...numberItems, {number: '', qty: ''}]);
  };

  // Handle removing a number+qty item
  const handleRemoveNumberItem = (index: number) => {
    if (numberItems.length > 1) {
      setNumberItems(numberItems.filter((_, i) => i !== index));
    }
  };

  // Handle updating number field (force uppercase)
  const handleNumberChange = (index: number, value: string) => {
    const newItems = [...numberItems];
    newItems[index].number = value.toUpperCase();
    setNumberItems(newItems);
  };

  // Handle updating qty field for a number item
  const handleNumberQtyChange = (index: number, value: string) => {
    // Allow empty or valid number
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }
    const newItems = [...numberItems];
    // Remove leading zeros
    newItems[index].qty = value.replace(/^0+/, '') || (value === '' ? '' : '0');
    setNumberItems(newItems);
  };

  // Handle SO Number change (force uppercase)
  const handleSoNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoNumber(e.target.value.toUpperCase());
  };

  // 處理照片上傳
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // 限制最多10張
    const newFiles = [...photos, ...files].slice(0, 10);
    setPhotos(newFiles);
  };

  // 移除單張照片
  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  // Function to clear form fields
  const clearForm = () => {
    setNumberItems([{number: '', qty: ''}]); // 重置為單一空項目
    setBarcode('');
    // setCategory('0'); // 保留 - retain previous value
    setPhotos([]); // 清空照片
    // setSoNumber(''); // 保留 - retain previous value
    setWeight(''); // 清空為空字串
    // setCurrentStatus('0'); // 保留 - retain previous value
    setNoted('');
    setSoNumberError('');
    setWeightError(''); // 清空錯誤訊息
    // setCargo(''); // 保留 - retain previous value
    // vender, client, date, category, status, cargo, so_number 保留
  };

  // Function to add product to temporary list
  const handleAddProduct = () => {
    // Validate required fields
    let hasError = false;
    if (!barcode || !date || !so_number) {
      if (!barcode) alert('Barcode is required');
      if (!date) setDateError('Date is required');
      if (!so_number) setSoNumberError('SO Number is required');
      hasError = true;
    } else {
      setSoNumberError('');
    }

    // Check for validation errors in weight
    if (weightError) {
      alert('Please fix the validation errors before adding the product');
      hasError = true;
    }

    if (hasError) return;

    // Filter out items with empty numbers, keep items that have number or qty
    const validItems = numberItems.filter(item => item.number.trim() !== '' || item.qty.trim() !== '');
    const itemsToUse = validItems.length > 0 ? validItems : [{number: '', qty: ''}];

    // Create one product for each number+qty item
    const newProducts: TempProduct[] = itemsToUse.map((item, idx) => ({
      id: `${Date.now()}-${idx}`,
      number: item.number,
      so_number,
      barcode,
      qty: item.qty,
      weight,
      date,
      vender,
      client,
      category,
      current_status,
      noted,
      photos,
      cargo: cargo || undefined,
    }));

    // Add to temporary products
    setTempProducts([...tempProducts, ...newProducts]);

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
        tempProducts.map(async (product, idx) => {
          // 檢查 so_number 不為空
          if (!product.so_number || product.so_number.trim() === '') {
            alert(`第 ${idx + 1} 筆產品 SO Number 不可為空`);
            throw new Error('SO Number is required');
          }
          const formData = new FormData();
          // 必要欄位一定要 append
          formData.append('barcode', product.barcode);
          formData.append('date', product.date);
          formData.append('so_number', product.so_number);
          // 其餘欄位有值才 append
          if (product.number && product.number.trim() !== '') formData.append('number', product.number);
          if (product.qty && product.qty.trim() !== '') formData.append('qty', product.qty);
          if (product.vender && product.vender.trim() !== '') formData.append('vender', product.vender);
          if (product.client && product.client.trim() !== '') formData.append('client', product.client);
          if (product.category && product.category.trim() !== '') formData.append('category', product.category);
          if (product.weight && product.weight.trim() !== '') formData.append('weight', product.weight);
          if (product.current_status && product.current_status.trim() !== '') formData.append('current_status', product.current_status);
          if (product.noted && product.noted.trim() !== '') formData.append('noted', product.noted);
          if (product.cargo && product.cargo.trim() !== '') formData.append('cargo', product.cargo);
          // 上傳多張照片
          product.photos.forEach((file, i) => {
            formData.append('photos', file);
            // Debug log for each photo
            console.log(`Appending photo[${i}]:`, file);
          });
          // Debug log for FormData
          for (let pair of formData.entries()) {
            if (pair[1] instanceof File) {
              console.log('FormData file:', pair[0], pair[1].name, pair[1].type, pair[1].size);
            } else {
              console.log('FormData field:', pair[0], pair[1]);
            }
          }

          const result = await createProduct(formData);
          console.log('createProduct result:', result);
          return result;
        })
      );
      if (results.every(result => result && result.success)) {
        router.push('/dashboard');
      } else {
        console.error('Failed to create product:', results);
        alert('Failed to create product. Please check the console for details.');
      }
    } catch (error) {
      console.error('An error occurred:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Temporary Products List */}
          <div className="rounded-lg bg-white shadow-md p-2 md:p-3 border border-gray-100 xl:col-span-1 w-full">
            <div className="flex items-center justify-between space-x-3 mb-2">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 p-1 rounded-lg">
                  <PlusIcon className="h-3 w-3 text-blue-600" />
                </div>
                <h1 className={`${lusitana.className} text-base font-bold text-gray-900`}>List</h1>
              </div>
              {tempProducts.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setTempProducts([])}
                  className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {tempProducts.length === 0 ? (
              <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <PlusIcon className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No products added yet</p>
                <p className="text-sm text-gray-400">Fill the form and click "Add" to begin creating products</p>
              </div>
            ) : (
              <div className="h-[500px] overflow-y-auto rounded border border-gray-200 shadow-inner">
                <table className="w-full text-xs text-left text-gray-500">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm font-medium">
                    <tr>
                      <th scope="col" className="px-1 py-2 whitespace-nowrap text-center w-6">Act</th>
                      <th scope="col" className="px-2 py-2 whitespace-nowrap">Barcode</th>
                      <th scope="col" className="px-2 py-2 whitespace-nowrap">SO Number</th>
                      <th scope="col" className="px-2 py-2 whitespace-nowrap">Number</th>
                      <th scope="col" className="px-2 py-2 whitespace-nowrap text-center">Qty</th>
                      <th scope="col" className="px-2 py-2 whitespace-nowrap text-center">Weight</th>
                      <th scope="col" className="px-2 py-2 whitespace-nowrap">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempProducts.map((product) => (
                      <ExpandableRow
                        key={product.id}
                        product={product}
                        onRemove={handleRemoveProduct}
                        getCategoryName={getCategoryName}
                        onDetailClick={(product) => { setDetailProduct(product); setDetailDialogOpen(true); }}
                      />
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
          <div className="rounded-lg bg-white shadow-md p-8 md:p-10 border border-gray-100 order-first xl:order-none xl:col-span-1 w-full max-w-none text-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <PencilSquareIcon className="h-4 w-4 text-blue-600" />
                </div>
                <h1 className={`${lusitana.className} text-lg font-bold text-gray-900`}>Add New Product</h1>
              </div>
              <button 
                type="button"
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm transition-colors"
              >
                <PlusIcon className="h-3 w-3" />
                <span>Add to List</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4 w-full">
              {/* Numbers + Qty Section - Multiple number+qty pairs */}
              <div className="mb-0 md:col-span-2 xl:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-sm font-bold text-gray-700">
                    Numbers + Qty
                  </label>
                  <button
                    type="button"
                    onClick={handleAddNumberItem}
                    className="flex items-center justify-center w-7 h-7 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-3 items-center">
                    {numberItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200">
                        <input
                          value={item.number}
                          onChange={(e) => handleNumberChange(index, e.target.value)}
                          className="w-28 rounded-md border border-gray-300 py-1.5 px-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                          placeholder="Number"
                        />
                        <input
                          value={item.qty}
                          onChange={(e) => handleNumberQtyChange(index, e.target.value)}
                          className="w-16 rounded-md border border-gray-300 py-1.5 px-2 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                          placeholder="Qty"
                        />
                        {numberItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNumberItem(index)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* so_number */}
              <div className="mb-0">
                <label htmlFor="so_number" className="mb-2 block text-sm font-bold text-gray-700">
                  SO Number
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="so_number"
                  name="so_number"
                  value={so_number}
                  onChange={handleSoNumberChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                  required={tempProducts.length === 0}
                />
                {soNumberError && (
                  <p className="mt-1 text-xs text-red-500">{soNumberError}</p>
                )}
              </div>

              {/* Barcode */}
              <div className="mb-0">
                <label htmlFor="barcode" className="mb-2 block text-sm font-bold text-gray-700">
                  Barcode
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    id="barcode"
                    name="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="peer block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required={tempProducts.length === 0}
                  />
                  
                </div>
              </div>

              {/* weight */}
              <div className="mb-0">
                <label htmlFor="weight" className="mb-2 block text-sm font-bold text-gray-700">
                  Weight
                </label>
                <input
                  id="weight"
                  name="weight"
                  value={weight}
                  onChange={handleWeightChange}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                {weightError && (
                  <p className="mt-1 text-xs text-red-500">{weightError}</p>
                )}
              </div>

              {/* Date (Required) */}
              <div className="mb-0">
                <label htmlFor="date" className="mb-2 block text-sm font-bold text-gray-700">
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
                    className="peer block w-full rounded-md border border-gray-300 py-2 pl-4 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="ml-2 rounded-md bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 transition-colors text-xs font-medium"
                  >
                    Today
                  </button>
                </div>
                {dateError && (
                  <p className="mt-1 text-xs text-red-500">{dateError}</p>
                )}
              </div>

              {/* Vendor */}
              <div className="mb-0">
                <label htmlFor="vender" className="mb-2 block text-sm font-bold text-gray-700">
                  Vendor
                </label>
                <div className="relative">
                  <input
                    id="vender"
                    name="vender"
                    value={vender}
                    onChange={handleVenderChange}
                    className="peer block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                 
                  />
          
                </div>
              </div>

              {/* Client */}
              <div className="mb-0">
                <label htmlFor="client" className="mb-2 block text-sm font-bold text-gray-700">
                  Client
                </label>
                <div className="relative">
                  <input
                    id="client"
                    name="client"
                    value={client}
                    onChange={handleClientChange}
                    className="peer block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                   
                  />
                  
                </div>
              </div>

              {/* status */}
              <div className="mb-0">
              <label htmlFor="current_status" className="mb-2 block text-sm font-bold text-gray-700">
                Status
              </label>
              <select
                id="current_status"
                name="current_status"
                value={current_status}
                onChange={e => setCurrentStatus(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="0">0: 入庫</option>
                <option value="1">1: 出貨</option>
              </select>
              </div>

              {/* Cargo */}
              <div className="mb-0">
                <SearchableSelect
                  options={cargos}
                  value={cargo}
                  onChange={setCargo}
                  label="Cargo"
                  placeholder="-- Select Cargo --"
                  className="text-xs"
                />
              </div>

              {/* Category */}
              <div className="mb-0">
                <label htmlFor="category" className="mb-2 block text-sm font-bold text-gray-700">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="peer block w-full rounded-md border border-gray-300 py-2 pl-8 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="0"> 0: Normal</option>
                    <option value="1"> 1: 大顆SSD</option>
                    <option value="2"> 2: Ram</option>
                    <option value="3"> 3: 小顆SSD </option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                </div>
              </div>

              {/* note */}
              <div className="mb-0 xl:col-span-2">
                <label htmlFor="noted" className="mb-2 block text-sm font-bold text-gray-700">
                  Note
                </label>
                <input
                  type="text"
                  id="noted"
                  name="noted"
                  value={noted}
                  onChange={e => setNoted(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 text-xs outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                
                />
              </div>

              {/* 新增照片上傳 */}
              <div className="mb-0 md:col-span-2 xl:col-span-3">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Photos (最多10張)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  disabled={photos.length >= 10}
                  className="block w-full rounded-md border border-gray-300 py-1 px-2 text-xs"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {photos.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${idx}`}
                        className="w-10 h-10 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-80 hover:opacity-100"
                        title="移除"
                      >×</button>
                    </div>
                  ))}
                </div>
                {photos.length >= 10 && (
                  <p className="text-xs text-red-500 mt-1">最多只能上傳10張圖片</p>
                )}
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
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : tempProducts.length > 0 ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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

      {/* Detail Dialog */}
      {detailDialogOpen && detailProduct && (
        <Dialog
          isOpen={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          onConfirm={() => setDetailDialogOpen(false)}
          title="產品詳細資料"
        >
          <div className="space-y-2 text-sm text-gray-700">
            <div><span className="font-semibold">Barcode:</span> {detailProduct.barcode}</div>
            <div><span className="font-semibold">Number:</span> {detailProduct.number || '-'}</div>
            <div><span className="font-semibold">Qty:</span> {detailProduct.qty || '0'}</div>
            <div><span className="font-semibold">Category:</span> {getCategoryName(detailProduct.category)}</div>
            <div><span className="font-semibold">Date:</span> {detailProduct.date}</div>
            <div><span className="font-semibold">Vendor:</span> {detailProduct.vender || '-'}</div>
            <div><span className="font-semibold">Client:</span> {detailProduct.client || '-'}</div>
            <div><span className="font-semibold">Photos:</span> {detailProduct.photos.length > 0 ? `${detailProduct.photos.length} 張` : '無'}</div>
            {detailProduct.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {detailProduct.photos.map((file, idx) => (
                  <img key={idx} src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="w-14 h-14 object-cover rounded border" />
                ))}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

// 在檔案底部新增 ExpandableRow 元件
function ExpandableRow({ product, onRemove, getCategoryName, onDetailClick }: { product: TempProduct, onRemove: (id: string) => void, getCategoryName: (v: string) => string, onDetailClick: (product: TempProduct) => void }) {
  return (
    <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer text-xs h-8" onClick={() => onDetailClick(product)}>
      <td className="px-1 py-1 text-center w-6" onClick={e => { e.stopPropagation(); onRemove(product.id); }}>
        <button
          type="button"
          className="p-0.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
          title="Remove product"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </td>
      <td className="px-2 py-1 truncate text-gray-700 font-semibold max-w-[100px]">{product.barcode}</td>
      <td className="px-2 py-1 truncate text-gray-900 font-semibold max-w-[120px]">{product.so_number}</td>
      <td className="px-2 py-1 truncate text-gray-700 font-semibold max-w-[80px]">{product.number || '-'}</td>
      <td className="px-2 py-1 text-center text-gray-700 font-semibold">{product.qty || '0'}</td>
      <td className="px-2 py-1 text-center text-gray-700 font-semibold">{product.weight || '0'}</td>
      <td className="px-2 py-1 truncate text-gray-700 max-w-[80px]">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
          product.category === '1' ? 'bg-blue-100 text-blue-700' :
          product.category === '2' ? 'bg-green-100 text-green-700' :
          product.category === '3' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {getCategoryName(product.category)}
        </span>
      </td>
    </tr>
  );
}
