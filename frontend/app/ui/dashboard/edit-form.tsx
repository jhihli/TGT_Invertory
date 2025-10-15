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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 mb-6 flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Number Field */}
        <div className="space-y-2">
          <label htmlFor="number" className="block text-sm font-medium text-gray-700">
            Number
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="number"
              name="number"
              type="text"
              value={formData.number}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product number"
            />
          </div>
        </div>

        {/* Barcode Field */}
        <div className="space-y-2">
          <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
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
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product barcode"
              required
            />
          </div>
        </div>

        {/* Quantity Field */}
        <div className="space-y-2">
          <label htmlFor="qty" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="qty"
              name="qty"
              type="number"
              value={formData.qty}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product quantity"
            />
          </div>
        </div>

        {/* Date Field */}
        <div className="space-y-2">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
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
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              required
            />
          </div>
        </div>

        {/* Vendor Field */}
        <div className="space-y-2">
          <label htmlFor="vender" className="block text-sm font-medium text-gray-700">
            Vendor
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="vender" 
              name="vender"
              type="text"
              value={formData.vender}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product vendor"
            />
          </div>
        </div>

        {/* Client Field */}
        <div className="space-y-2">
          <label htmlFor="client" className="block text-sm font-medium text-gray-700">
            Client
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="client"
              name="client"
              type="text"
              value={formData.client}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product client"
            />
          </div>
        </div>

        {/* Category Field */}
        <div className="space-y-2">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <div className="relative rounded-md shadow-sm">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="0"> 0: Normal</option>
              <option value="1"> 1: 大顆SSD</option>
              <option value="2"> 2: Ram</option>
              <option value="3"> 3: 小顆SSD </option>
            </select>
          </div>
        </div>

        {/* Weight Field */}
        <div className="space-y-2">
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
            Weight
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              id="weight"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Product weight"
            />
          </div>
        </div>

        {/* Current Status Field */}
        <div className="space-y-2">
          <label htmlFor="current_status" className="block text-sm font-medium text-gray-700">
            Current Status
          </label>
          <div className="relative rounded-md shadow-sm">
            <select
              id="current_status"
              name="current_status"
              value={formData.current_status}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="">請選擇</option>
              <option value="0">0: 入庫</option>
              <option value="1">1: 出貨</option>
            </select>
          </div>
        </div>

        {/* Cargo Field */}
        <div className="space-y-2">
          <SearchableSelect
            options={cargos}
            value={formData.cargo}
            onChange={(value) => setFormData(prev => ({ ...prev, cargo: value }))}
            label="Cargo"
            placeholder="-- Select Cargo --"
          />
        </div>

        {/* Noted Field */}
        <div className="space-y-2">
          <label htmlFor="noted" className="block text-sm font-medium text-gray-700">
            Noted
          </label>
          <div className="relative rounded-md shadow-sm">
            <textarea
              id="noted"
              name="noted"
              value={formData.noted}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors min-h-[120px] text-base"
              placeholder="Product noted"
              rows={5}
            />
          </div>
        </div>

        {/* 圖片編輯區 */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (最多10張)</label>
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
          {/* 上傳新圖片 */}
          <input
            ref={fileInputRef}
            type="file" accept="image/*" multiple onChange={handleNewPhotoChange}
            disabled={existingPhotos.length + newPhotos.length >= 10}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-base bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" />
          {(existingPhotos.length + newPhotos.length) >= 10 && (
            <p className="text-xs text-red-500 mt-1">最多只能上傳10張圖片</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <XCircleIcon className="h-5 w-5 mr-2 text-gray-500" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-blue-300 transition-colors"
        >
          {isSubmitting ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5 mr-2" />
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