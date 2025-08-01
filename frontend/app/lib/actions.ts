
'use server';

// 批次更新產品狀態 update  current_status and ex_date after 出貨
export async function batchUpdateProductStatus(ids: string[], targetStatus: '0' | '1', ex_date?: string) {
  try {
    if (!API_URL) {
      throw new Error("API URL is not set!");
    }
    const body: any = { ids, current_status: targetStatus };
    if (ex_date) {
      body.ex_date = ex_date;
    }
    const response = await fetch(`${API_URL}/product/batch_update_status/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Failed to update status');
    }
    revalidatePath('/dashboard');
    return {
      success: true,
      message: result.message || 'Status updated successfully',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update status',
      data: null,
    };
  }
}

import { z } from 'zod';
//import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL;

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateProdut = InvoiceSchema.omit({ id: true, date: true });

const ProductSchema = z.object({
  number: z.string(),
  barcode: z.string(),
  qty: z.string(),
  date: z.string(),
});

// export type State = {
//   errors?: {
//     customerId?: string[];
//     amount?: string[];
//     status?: string[];
//   };
//   message?: string | null;
// };

export async function createProduct(formData: FormData | Array<any>) {
  try {
    if (!API_URL) {
      throw new Error("API URL is not set!");
    }

    // 如果是 FormData（含檔案），直接傳送 multipart/form-data
    if (typeof FormData !== 'undefined' && formData instanceof FormData) {
      // Debug: 檢查 FormData 內容
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log('Sending FormData file:', pair[0], pair[1].name, pair[1].type, pair[1].size);
        } else {
          console.log('Sending FormData field:', pair[0], pair[1]);
        }
      }
      const response = await fetch(`${API_URL}/product/products/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Server error:', result);
        throw new Error(result.message || result.error || 'Failed to create products');
      }
      revalidatePath('/dashboard');
      return {
        success: true,
        message: 'Products created successfully',
        data: result,
        created_count: result.created_count,
        total_count: result.total_count
      };
    }

    // 否則用 JSON 傳送（不含檔案）
    if (Array.isArray(formData)) {
      const productsData = formData.map(prod => ({
        ...prod,
        qty: parseInt(prod.qty) || 0,
        so_number: prod.so_number || '',
        weight: prod.weight || '',
        current_status: prod.current_status || '',
        noted: prod.noted || ''
      }));
      const response = await fetch(`${API_URL}/product/products/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productsData),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Server error:', result);
        throw new Error(result.message || result.error || 'Failed to create products');
      }
      revalidatePath('/dashboard');
      return {
        success: true,
        message: 'Products created successfully',
        data: result,
        created_count: result.created_count,
        total_count: result.total_count
      };
    }
    // 若不是 FormData 也不是 Array，回傳錯誤
    throw new Error('Invalid formData type for createProduct');
  } catch (error) {
    console.error('Failed to create products:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create products',
      errors: {},
      data: null
    };
  }
}

export async function deleteProducts(ids: string[]) {
  try {
    if (!API_URL) {
      throw new Error("API URL is not set!");
    }

    console.log('Deleting products with IDs:', ids);
    
    // Delete each product one by one using the correct endpoint
    const deletePromises = ids.map(async (id) => {
      const url = `${API_URL}/product/products/${id}/`;
      console.log('Sending DELETE request to:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Failed to delete product ${id}. Server response:`, responseText);
        throw new Error(`Failed to delete product with ID ${id}: ${response.status}`);
      }
      
      return id;
    });

    // Wait for all delete operations to complete
    await Promise.all(deletePromises);

    // Revalidate the dashboard path to refresh the data
    revalidatePath('/dashboard');
    return { success: true, message: `Successfully deleted ${ids.length} products` };
  } catch (error) {
    console.error('Failed to delete products:', error);
    return { 
      success: false, 
      message: `Failed to delete products: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function updateProduct(id: string, formData: FormData | { 
  number: string; 
  barcode: string; 
  qty: string | number; 
  date: string;
  vender?: string;
  client?: string;
  category?: string;
}) {
  try {
    if (!API_URL) {
      throw new Error("API URL is not set!");
    }
    const url = `${API_URL}/product/products/${id}/`;
    // 若為 FormData（含檔案），直接傳送 multipart/form-data
    if (typeof FormData !== 'undefined' && formData instanceof FormData) {
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Failed to update product. Server response:', responseText);
        throw new Error(`Failed to update product with ID ${id}: ${response.status}`);
      }
      const data = await response.json();
      console.log('Product updated successfully:', data);
      revalidatePath('/dashboard');
      return { success: true, message: 'Product updated successfully', data };
    }
    // 若為物件（JSON）
    const processedData = {
      ...formData,
      qty: typeof (formData as any).qty === 'string' ? parseInt((formData as any).qty) : (formData as any).qty
    };
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedData),
    });
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Failed to update product. Server response:', responseText);
      throw new Error(`Failed to update product with ID ${id}: ${response.status}`);
    }
    const data = await response.json();
    console.log('Product updated successfully:', data);
    revalidatePath('/dashboard');
    return { success: true, message: 'Product updated successfully', data };
  } catch (error) {
    console.error('Failed to update product:', error);
    return {
      success: false,
      message: `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

//// Use Zod to update the expected types
//const UpdateInvoice = InvoiceSchema.omit({ id: true, date: true });

// ...

// export async function updateInvoice(
//   id: string,
//   prevState: State,
//   formData: FormData
// ){

//   // Validate form fields using Zod
//   const validatedFields = UpdateInvoice.safeParse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });

//   // If form validation fails, return errors early. Otherwise, continue.
//   if (!validatedFields.success) {
//     return {
//       errors: validatedFields.error.flatten().fieldErrors,
//       message: 'Missing Fields. Failed to Update Invoice.',
//     };
//   }

//   // Prepare data for insertion into the database
//   const { customerId, amount, status } = validatedFields.data;
//   const amountInCents = amount * 100;
//   // Insert data into the database
//   try {
//     await sql`
//       UPDATE invoices
//       SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//       WHERE id = ${id}
//     `;
//   } catch (error) {
//     return { message: 'Database Error: Failed to Update Invoice.' };
//   }
//   // Revalidate the cache for the invoices page and redirect the user.
//   revalidatePath('/dashboard/invoices');
//   redirect('/dashboard/invoices');
// }

// export async function deleteInvoice(id: string) {
//   // throw new Error('Failed to Delete Invoice');
//   try {
//     await sql`DELETE FROM invoices WHERE id = ${id}`;
//     revalidatePath('/dashboard/invoices');
//   } catch (error) {
//     return { message: 'Database Error: Failed to Delete Invoice.' };
//   }
// }


// export async function authenticate(
//   prevState: string | undefined,
//   formData: FormData,
// ) {
//   try {
//     await signIn('credentials', Object.fromEntries(formData));
//   } catch (error) {
//     if ((error as Error).message.includes('CredentialsSignin')) {
//       return 'CredentialSignin';
//     }
//     throw error;
//   }
// }