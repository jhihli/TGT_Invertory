'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct } from '@/app/lib/actions';
import { Product } from '@/interface/IDatatable';
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
  const [formData, setFormData] = useState({
    number: product.number || '',
    barcode: product.barcode || '',
    qty: product.qty || '',
    date: product.date || '',
    vender: product.vender || '',
    client: product.client || '',
    category: product.category || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert product.id to string if it's a bigint
      const productId = String(product.id);
      const result = await updateProduct(productId, formData);
      
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
    </form>
  );
}