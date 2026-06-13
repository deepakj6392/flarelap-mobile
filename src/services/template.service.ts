import { API_ROUTES } from "../constants/routes";
import api from "./api.service";

export const getAllTemplates = async () => {
    const response = await api.get(API_ROUTES.TEMPLATES);
    return response.data;
};

export const getTrendingTemplates = async (limit: number, skip: number) => {
    const response = await api.get(`${API_ROUTES.TRENDING_TEMPLATES}?limit=${limit}&skip=${skip}`);
    return response.data;
};
