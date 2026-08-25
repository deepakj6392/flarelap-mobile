import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { API_ROUTES } from "../constants/routes";
import api from "./api.service";

export const getAllTemplates = async (
    category: string,
    subCategory: string | null = null,
    limit?: number,
    skip?: number,
) => {
    const response = await api.get(API_ROUTES.TEMPLATES, {
        params: { category, subCategory, ...(limit !== undefined && { limit }), ...(skip !== undefined && { skip }) }
    });
    return response.data;
};

export const getTrendingTemplates = async (limit: number, skip: number) => {
    const response = await api.get(`${API_ROUTES.TRENDING_TEMPLATES}?limit=${limit}&skip=${skip}`);
    return response.data;
};

export interface FabricObject {
    type: string;
    left: number;
    top: number;
    width: number;
    height: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    fill?: string | null;
    stroke?: string | null;
    strokeWidth?: number;
    strokeDashArray?: number[] | null;
    opacity?: number;
    originX?: string;
    originY?: string;
    rx?: number;
    ry?: number;
    text?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontStyle?: string;
    path?: Array<Array<string | number>>;
    src?: string;
    selectable?: boolean;
    visible?: boolean;
    [key: string]: any;
}

export interface FabricJSON {
    version: string;
    objects: FabricObject[];
}

export interface SvgToFabricResult {
    svgUrl: string;
    svgFilename: string;
    fabricJSON: FabricJSON;
}

export const svgUrlToFabricJSON = async (svgUrl: string): Promise<SvgToFabricResult> => {
    // Fetch the SVG content from the remote URL as text
    const svgResponse = await fetch(svgUrl);
    if (!svgResponse.ok) throw new Error(`Failed to fetch SVG: HTTP ${svgResponse.status}`);
    const svgText = await svgResponse.text();
    try {
        const response = await api.post(API_ROUTES.SVG_TO_FABRIC, {
            svg: svgText.toString(),
            width: 0,
            height: 0
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.data?.success) {
            throw new Error(response.data?.message || 'SVG to Fabric conversion failed');
        }

        return {
            svgUrl,
            svgFilename: svgUrl.split('/').pop() || 'template.svg',
            fabricJSON: response.data.fabricJSON || response.data.data?.fabricJSON
        };
    } finally {
        // Clean up the temporary file
        try {

        } catch (err) {
            console.warn('Failed to clean up temp SVG file:', err);
        }
    }
};

export const svgStringToFabricJSON = async (svgText: string): Promise<FabricJSON> => {
    const response = await api.post(API_ROUTES.SVG_TO_FABRIC, {
        svg: svgText,
        width: 0,
        height: 0
    }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000 // 2-minute timeout for slow server conversions
    });

    if (!response.data?.success) {
        throw new Error(response.data?.message || 'SVG to Fabric conversion failed');
    }

    return response.data.fabricJSON || response.data.data?.fabricJSON;
};

