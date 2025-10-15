export interface Product {
    id: bigint | string;
    number: string;
    so_number: string;
    barcode: string;
    qty: number;
    date: string;
    ex_date: string;
    vender: string;
    client: string;
    category: string;
    weight: number;
    noted: string;
    current_status: string;
    photos?: Photo[]; // 關聯多張圖片
    created_by?: bigint | string | null; // User ID who created the product
    created_by_username?: string; // Username of the creator
}

export interface Photo {
    id: bigint | string;
    product_id: bigint | string; // 關聯產品ID，欄位名稱與資料庫一致
    path: string; // 圖片路徑/URL，欄位名稱與資料庫一致
}

export type User = {
    id: bigint | string;
    password: string;
    last_login: string;
    is_speruser: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_staff: string;
    is_active: string;
    date_joined: string;
    role: string;

}

