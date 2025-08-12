export interface Iproduct {
    id: number;
    product_name: string;
    product_image: string;
    uom: number;
    sort: number;
    status: number;
    cgst?: number;
    sgst?: number;
    rough_product_id?: number;
    base_price?: number;
    delivery_charges?: number;
    mrp?: number;
    ms_product_type_id: number;
    unit_name: string;
    rough_product_name: string;
    is_gst_included: boolean
    created_on: string;
}