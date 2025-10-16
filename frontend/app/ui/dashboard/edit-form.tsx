'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct } from '@/app/lib/actions';
import { Product, Photo, Cargo } from '@/interface/IDatatable';
import { getCargos } from '@/app/lib/data';
import SearchableSelect from '@/app/ui/SearchableSelect';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function EditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [formData, setFormData] = useState({
    so_number: product.so_number || '',
    number: product.number || '',
    barcode: product.barcode || '',
    qty: product.qty !== undefined && product.qty !== null && String(product.qty) !== '' ? String(product.qty) : '0',
    date: product.date || today,
    vender: product.vender || '',
    client: product.client || '',
    category: product.category || '',
    weight: product.weight !== undefined && product.weight !== null && String(product.weight) !== '' ? String(product.weight) : '',
    current_status: product.current_status !== undefined && product.current_status !== null && product.current_status !== '' ? product.current_status : '0',
    noted: product.noted || '',
    cargo: product.cargo ? String(product.cargo) : '',
  });
  const [cargos, setCargos] = useState<Cargo[]>([]);
  // 型別修正：Photo 來自 interface/IDatatable，且路徑欄位為 path
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>(product.photos || []);
  const [photosToDelete, setPhotosToDelete] = useState<(number | string)[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qtyError, setQtyError] = useState(''); // 新增數量錯誤訊息
  const [weightError, setWeightError] = useState(''); // 新增重量錯誤訊息

  // Fetch cargos on component mount
  useEffect(() => {
    const fetchCargos = async () => {
      const data = await getCargos();
      setCargos(data);
    };
    fetchCargos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle quantity change with validation
  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      setFormData((prev) => ({ ...prev, qty: '' }));
      setQtyError('');
      return;
    }

    // Check if value is a valid number
    if (!/^\d+$/.test(value)) {
      setQtyError('Quantity must be a number');
      return;
    }

    // Remove leading zeros (e.g., '00222' becomes '222', '00002' becomes '2')
    const cleanedValue = value.replace(/^0+/, '') || '0';

    setFormData((prev) => ({ ...prev, qty: cleanedValue }));
    setQtyError('');
  };

  // Handle weight change with validation
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty value
    if (value === '') {
      setFormData((prev) => ({ ...prev, weight: '' }));
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

    setFormData((prev) => ({ ...prev, weight: cleanedValue }));
    setWeightError('');
  };

  // 處理現有圖片刪除
  const handleRemoveExistingPhoto = (photoId: string | number | bigint) => {
    setPhotosToDelete([...photosToDelete, photoId.toString()]);
    setExistingPhotos(existingPhotos.filter(photo => photo.id.toString() !== photoId.toString()));
  };

  // 處理新圖片上傳
  const handleNewPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // 統一比對 key：檔名（去除空白）
    const existingFileNames = new Set(existingPhotos.map(p => (p.path.split('/').pop() || '').trim()));
    const newFileKeys = new Set(newPhotos.map(f => `${f.name.trim()}_${f.size}`));
    let duplicateMsg = '';
    for (const file of files) {
      const fileName = file.name.trim();
      if (existingFileNames.has(fileName)) {
        duplicateMsg = `圖片「${file.name}」已存在，請勿重複選取。`;
        break;
      }
      const key = `${fileName}_${file.size}`;
      if (newFileKeys.has(key)) {
        duplicateMsg = `圖片「${file.name}」已存在，請勿重複選取。`;
        break;
      }
    }
    if (duplicateMsg) {
      setDialogMessage(duplicateMsg);
      setDialogOpen(true);
      // 清空 input，確保同圖可再次觸發
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    // 限制總數最多10張（現有+新）
    const total = existingPhotos.length + newPhotos.length;
    const allowed = Math.max(0, 10 - total);
    const uniqueFiles: File[] = [];
    for (const file of files) {
      const fileName = file.name.trim();
      const key = `${fileName}_${file.size}`;
      if (!existingFileNames.has(fileName) && !newFileKeys.has(key)) {
        uniqueFiles.push(file);
        newFileKeys.add(key);
      }
    }
    setNewPhotos([...newPhotos, ...uniqueFiles.slice(0, allowed)]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 移除新上傳圖片
  const handleRemoveNewPhoto = (idx: number) => {
    setNewPhotos(newPhotos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for validation errors
    if (qtyError || weightError) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const productId = String(product.id);
      // 準備 FormData
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => fd.append(key, String(value)));
      // 新增圖片
      newPhotos.forEach(file => fd.append('photos', file));
      // 傳遞要刪除的舊圖 id
      photosToDelete.forEach(id => fd.append('delete_photo_ids', String(id)));
      // updateProduct 支援 FormData
      const result = await updateProduct(productId, fd);
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.message || 'Failed to update product');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-6 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
        {/* Number Field */}
        <div className="space-y-1">
          <label htmlFor="number" className="block text-base font-bold text-gray-700">
            Number
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="number"
              name="number"
              type="text"
              value={formData.number}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product number"
            />
          </div>
        </div>

        {/* SO Number Field */}
        <div className="space-y-1">
          <label htmlFor="so_number" className="block text-base font-bold text-gray-700">
            SO Number
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="so_number"
              name="so_number"
              type="text"
              value={formData.so_number}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="SO number"
              required
            />
          </div>
        </div>

        {/* Barcode Field */}
        <div className="space-y-1">
          <label htmlFor="barcode" className="block text-base font-bold text-gray-700">
            Barcode
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="barcode"
              name="barcode"
              type="text"
              value={formData.barcode}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product barcode"
              required
            />
          </div>
        </div>

        {/* Quantity Field */}
        <div className="space-y-1">
          <label htmlFor="qty" className="block text-base font-bold text-gray-700">
            Quantity
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="qty"
              name="qty"
              type="text"
              value={formData.qty}
              onChange={handleQtyChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product quantity"
            />
          </div>
          {qtyError && (
            <p className="mt-1 text-xs text-red-500">{qtyError}</p>
          )}
        </div>

        {/* Date Field */}
        <div className="space-y-1">
          <label htmlFor="date" className="block text-base font-bold text-gray-700">
            Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Vendor Field */}
        <div className="space-y-1">
          <label htmlFor="vender" className="block text-base font-bold text-gray-700">
            Vendor
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="vender" 
              name="vender"
              type="text"
              value={formData.vender}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product vendor"
            />
          </div>
        </div>

        {/* Client Field */}
        <div className="space-y-1">
          <label htmlFor="client" className="block text-base font-bold text-gray-700">
            Client
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="client"
              name="client"
              type="text"
              value={formData.client}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product client"
            />
          </div>
        </div>

        {/* Category Field */}
        <div className="space-y-1">
          <label htmlFor="category" className="block text-base font-bold text-gray-700">
            Category
          </label>
          <div className="relative rounded-md shadow-sm">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="0"> 0: Normal</option>
              <option value="1"> 1: 大顆SSD</option>
              <option value="2"> 2: Ram</option>
              <option value="3"> 3: 小顆SSD </option>
            </select>
          </div>
        </div>

        {/* Weight Field */}
        <div className="space-y-1">
          <label htmlFor="weight" className="block text-base font-bold text-gray-700">
            Weight
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="weight"
              name="weight"
              type="text"
              value={formData.weight}
              onChange={handleWeightChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product weight"
            />
          </div>
          {weightError && (
            <p className="mt-1 text-xs text-red-500">{weightError}</p>
          )}
        </div>

        {/* Current Status Field */}
        <div className="space-y-1">
          <label htmlFor="current_status" className="block text-base font-bold text-gray-700">
            Current Status
          </label>
          <div className="relative rounded-md shadow-sm">
            <select
              id="current_status"
              name="current_status"
              value={formData.current_status}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="">請選擇</option>
              <option value="0">0: 入庫</option>
              <option value="1">1: 出貨</option>
            </select>
          </div>
        </div>

        {/* Cargo Field */}
        <div className="space-y-1">
          <SearchableSelect
            options={cargos}
            value={formData.cargo}
            onChange={(value) => setFormData(prev => ({ ...prev, cargo: value }))}
            label="Cargo"
            placeholder="-- Select Cargo --"
          />
        </div>

        {/* Noted Field */}
        <div className="space-y-1 md:col-span-1 xl:col-span-1">
          <label htmlFor="noted" className="block text-base font-bold text-gray-700">
            Note
          </label>
          <div className="relative rounded-md shadow-sm">
            <textarea
              id="noted"
              name="noted"
              value={formData.noted}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors min-h-[80px] text-base"
              placeholder=""
              rows={3}
            />
          </div>
        </div>

        {/* 圖片編輯區 */}
        <div className="space-y-1 md:col-span-1 xl:col-span-2">
          <div className="flex items-center gap-4 mb-1">
            <label className="block text-base font-bold text-gray-700">Photos (最多10張)</label>
            {/* 上傳新圖片 */}
            <input
              ref={fileInputRef}
              type="file" accept="image/*" multiple onChange={handleNewPhotoChange}
              disabled={existingPhotos.length + newPhotos.length >= 10}
              className="w-64 rounded-md border border-gray-300 py-1 px-2 text-sm bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" />
          </div>
          <div className="flex flex-wrap gap-3 mb-2 min-h-[72px]">
            {/* 現有圖片 */}
            {existingPhotos.map(photo => (
              <div key={photo.id.toString()} className="relative group w-18 h-18 flex flex-col items-center justify-center">
                <img src={photo.path} alt="photo" className="w-16 h-16 object-cover rounded border shadow-sm" />
                <button type="button" onClick={() => handleRemoveExistingPhoto(photo.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-base shadow hover:bg-red-600 transition"
                  title="移除舊圖">×</button>
              </div>
            ))}
            {/* 新上傳圖片預覽 */}
            {newPhotos.map((file, idx) => (
              <div key={idx} className="relative group w-18 h-18 flex flex-col items-center justify-center">
                <img src={URL.createObjectURL(file)} alt={`new-${idx}`} className="w-16 h-16 object-cover rounded border shadow-sm" />
                <button type="button" onClick={() => handleRemoveNewPhoto(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-base shadow hover:bg-red-600 transition"
                  title="移除新圖">×</button>
              </div>
            ))}
            {/* 無圖片時顯示提示 */}
            {existingPhotos.length + newPhotos.length === 0 && (
              <div className="flex items-center text-gray-400 text-sm h-16">尚未選擇圖片</div>
            )}
          </div>
          {(existingPhotos.length + newPhotos.length) >= 10 && (
            <p className="text-xs text-red-500 mt-1">最多只能上傳10張圖片</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center rounded-md bg-white px-6 py-3 text-base font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <XCircleIcon className="h-6 w-6 mr-2 text-gray-500" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-500 disabled:bg-blue-300 transition-colors"
        >
          {isSubmitting ? (
            <>
              <ArrowPathIcon className="h-6 w-6 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-6 w-6 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Dialog for duplicate image */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[260px] max-w-xs w-80 flex flex-col items-center">
            <div className="mb-4 text-red-600 text-base font-medium break-words whitespace-pre-line text-center w-full">
              {dialogMessage}
            </div>
            <button
              onClick={() => setDialogOpen(false)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </form>
  );
}