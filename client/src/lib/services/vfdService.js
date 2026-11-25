import axios from './apiInterceptor';
import { API_ENDPOINTS } from '../constants/api';

export const vfdModelApi = {
  list: async ({ page = 1, limit = 10, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await axios.get(`${API_ENDPOINTS.vfdModels}${qs}`);
    const data = res.data;
    return {
      vfdModels: data.vfdModels || [],
      total: data.total ?? (data.vfdModels ? data.vfdModels.length : 0),
      page: data.page || page,
      limit: data.limit || limit,
      totalPages: data.totalPages || 1,
    };
  },
  get: async (modelCode) => {
    const res = await axios.get(`${API_ENDPOINTS.vfdModels}/${encodeURIComponent(modelCode)}`);
    return res.data.vfdModel;
  },
  save: async (payload, modelCode) => {
    if (modelCode) {
      const res = await axios.put(`${API_ENDPOINTS.vfdModels}/${encodeURIComponent(modelCode)}`, payload);
      return res.data;
    }
    const res = await axios.post(API_ENDPOINTS.vfdModels, payload);
    return res.data;
  },
  remove: async (modelCode) => {
    const res = await axios.delete(`${API_ENDPOINTS.vfdModels}/${encodeURIComponent(modelCode)}`);
    return res.data;
  },
};

export const vfdParameterApi = {
  modelCodes: async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.vfdParams);
      const list = res.data?.models || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch (err) {
      console.warn('Failed to fetch from vfdparams, attempting vfdModels fallback', err);
    }

    try {
      const res = await axios.get(API_ENDPOINTS.vfdModels);
      const list = (res.data?.vfdModels || []).map((m) => m.modelCode).filter(Boolean);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    } catch (err) {
      console.warn('Failed to fetch from vfdModels', err);
    }

    return ['SI21', 'SI22', 'Hex'];
  },
  byModel: async (vfdModel, { page = 1, limit = 10, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await axios.get(`${API_ENDPOINTS.vfdParams}/${encodeURIComponent(vfdModel)}${qs}`);
    const data = res.data;
    return {
      parameters: (data.parameters || []).map((item) => ({ ...item, vfdModel: data.vfdModel })),
      total: data.total ?? (data.parameters ? data.parameters.length : 0),
      page: data.page || page,
      limit: data.limit || limit,
      totalPages: data.totalPages || 1,
      vfdModel: data.vfdModel,
    };
  },
  save: async (payload) => {
    const res = await axios.post(API_ENDPOINTS.vfdParams, payload);
    return res.data;
  },
  remove: async (vfdModel, address) => {
    const res = await axios.delete(`${API_ENDPOINTS.vfdParams}/${encodeURIComponent(vfdModel)}/${encodeURIComponent(address)}`);
    return res.data;
  },
};

export const vfdTelemetryApi = {
  models: async () => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.vfdTelemetry}/models`);
      return res.data.models || ['GLOBAL', 'SI21', 'SI22', 'HEX'];
    } catch {
      return ['GLOBAL', 'SI21', 'SI22', 'HEX'];
    }
  },
  byModel: async (vfdModel) => {
    const res = await axios.get(`${API_ENDPOINTS.vfdTelemetry}/${encodeURIComponent(vfdModel)}`);
    const data = res.data;
    return {
      configs: data.configs || [],
      total: data.total ?? (data.configs ? data.configs.length : 0),
      vfdModel: data.vfdModel,
    };
  },
  all: async () => {
    const res = await axios.get(`${API_ENDPOINTS.vfdTelemetry}/all`);
    const data = res.data;
    return {
      configs: data.configs || [],
      total: data.total ?? (data.configs ? data.configs.length : 0),
    };
  },
  save: async (payload) => {
    const res = await axios.post(API_ENDPOINTS.vfdTelemetry, payload);
    return res.data;
  },
  update: async (id, payload) => {
    const res = await axios.put(`${API_ENDPOINTS.vfdTelemetry}/${id}`, payload);
    return res.data;
  },
  remove: async (id) => {
    const res = await axios.delete(`${API_ENDPOINTS.vfdTelemetry}/${id}`);
    return res.data;
  },
};

export const configApi = {
  list: async ({ page = 1, limit = 10, search = '', ...filters } = {}) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (search) params.append('search', search);
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await axios.get(`${API_ENDPOINTS.config}${qs}`);
      const data = res.data;
      return {
        configs: data.configs || [],
        total: data.total ?? (data.configs ? data.configs.length : 0),
        page: data.page || page,
        limit: data.limit || limit,
        totalPages: data.totalPages || 1,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { configs: [], total: 0, page: 1, limit, totalPages: 1 };
      }
      throw error;
    }
  },
  get: async (id) => {
    const res = await axios.get(`${API_ENDPOINTS.config}/${id}`);
    return res.data;
  },
  save: async (payload) => {
    const res = await axios.post(API_ENDPOINTS.config, payload);
    return res.data;
  },
  remove: async (id) => {
    const res = await axios.delete(`${API_ENDPOINTS.config}/${id}`);
    return res.data;
  },
};

export const organisationApi = {
  list: async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.organisation);
      return {
        organisations: Array.isArray(res.data) ? res.data : (res.data.organisations || []),
      };
    } catch {
      return { organisations: [] };
    }
  },
};

export const getStoredUser = () => {
  try {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

