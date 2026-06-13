export interface Template {
    id: string;
    name: string;
    category: string;
    subCategory: string;
    thumbnail: string;
    svg_url: string;
    orientation: string;
    downloads: number;
    views: number;
    likes: number;
    is_paid: boolean;
    is_trending: boolean;
    status: string;
    created_by: number;
    usage_count: number;
    created_at: string;
    updated_at: string;
}
