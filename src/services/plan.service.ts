import api from "./api.service";

export const fetchPlans = async () => {
    const res = await api.get('/plans');
    return res?.data;
}