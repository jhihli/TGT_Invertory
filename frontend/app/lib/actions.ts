'use server';

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

    const productsData = formData instanceof FormData 
      ? [{
          number: formData.get('number') || '',
          barcode: formData.get('barcode') || '',
          qty: parseInt(formData.get('qty') as string) || 0,
          date: formData.get('date'),
          vender: formData.get('vender') || '',
          client: formData.get('client') || '',
          category: formData.get('category') || '0'
        }]
      : formData.map(prod => ({
          ...prod,
          qty: parseInt(prod.qty) || 0
        }));

    //console.log('Sending data:', productsData); // Debug log

    const response = await fetch(`${API_URL}/product/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productsData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Server error:', result); // Debug log
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

export async function updateProduct(id: string, formData: { 
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
    console.log('Sending PUT request to:', url);

    // Ensure qty is sent as a number
    const processedData = {
      ...formData,
      qty: typeof formData.qty === 'string' ? parseInt(formData.qty) : formData.qty
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