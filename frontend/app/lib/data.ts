'use server';

import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { Product, Cargo } from "@/interface/IDatatable"


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });


export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    // console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 100;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}



/////////////////////////////////////////////////////////////////////


export async function getProducts(
  query: string = '',
  currentPage: number = 1,
  sortField: string = '',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  try {
    // 確保頁碼至少為1
    const page = Math.max(1, currentPage);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_Django_API_URL}/product/products/?` +
      `search=${query}&` +
      `page=${page}&` +
      `limit=${ITEMS_PER_PAGE}&` +
      `sortField=${sortField}&` +
      `sortOrder=${sortOrder}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return []; // 返回空陣列而不是拋出錯誤
      }
      const errorData = await response.json();
      throw new Error(
        `Error: ${response.status} - ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

export async function fetchProductsTotalPage(query: string): Promise<number> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;
    if (!API_URL) {
      console.error("API URL is not set!");
      return 1;
    }

    const url = new URL(`${API_URL}/product/products/`);
    if (query) {
      url.searchParams.append("search", query);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return 1; // 發生錯誤時返回1而不是拋出錯誤
    }

    const data = await response.json();
    const count = Number(data.count) || 0;
    return Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
  } catch (error) {
    console.error("Unexpected error:", error);
    return 1;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;

  if (!API_URL) {
    console.error("API URL is not set!");
    return null;
  }

  // Use the list endpoint with a filter for the specific ID
  const url = new URL(`${API_URL}/product/products/`);
  url.searchParams.append("id", id);
  
  
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: 'no-store' // Ensure we get fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Product with ID ${id} not found`);
        return null;
      }
      
      console.error(`Error fetching product: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Response body: ${errorText}`);
      
      return null;
    }

    const data = await response.json();
    
    // The API returns a list, so we need to get the first item
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return null;
  }
}


export async function getAllProducts(query: string) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;

    const url = new URL(`${API_URL}/product/products/`);
    if (query) {
      url.searchParams.append("search", query);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });


    const data = await response.json();
    console.log(data.length);
    return data.results || [];
  } catch (error) {
    console.error("Unexpected error:", error);

  }
}

export async function getAllProductsForExport(query: string = '') {
  try {
    const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;

    const response = await fetch(
      `${API_URL}/product/export/?search=${query}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products for export');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getSSDForExport(query: string = '') {
  try {
    const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;
    if (!API_URL) {
      throw new Error('API URL is not configured');
    }

    const url = new URL(`${API_URL}/product/export/`);
    // 如果 query 不是空的，直接附加到 URL
    if (query) {
      url.search = query;  // 這會正確處理所有查詢參數
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products for export');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getCargos(): Promise<Cargo[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_Django_API_URL;
    if (!API_URL) {
      console.error('API URL is not configured');
      return [];
    }

    const response = await fetch(`${API_URL}/product/cargos/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch cargos');
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cargos:', error);
    return [];
  }
}