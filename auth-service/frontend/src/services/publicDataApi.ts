import api from './api';

export interface Dataset {
  id?: string;
  name?: string;
  title?: string;
  notes?: string;
  resources?: Array<{
    url: string;
    format: string;
    name: string;
  }>;
  tags?: Array<{ name: string }>;
  organization?: {
    name: string;
    title: string;
  };
}

export interface ExplainAlertResponse {
  explanation: string;
  original: string;
}

export interface ExplainSocialAidResponse {
  explanation: string;
  question: string;
}

export const publicDataAPI = {
  // Datasets
  listDatasets: async (search?: string, limit: number = 20): Promise<{ datasets: Dataset[]; count: number }> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());
    const response = await api.get(`/public-data/datasets?${params.toString()}`);
    return response.data;
  },

  getDataset: async (packageId: string): Promise<{ dataset: Dataset }> => {
    const response = await api.get(`/public-data/datasets/${packageId}`);
    return response.data;
  },

  // Datastore Search
  getPredefinedResources: async (): Promise<{
    resources: Array<{
      id: string;
      name: string;
      description: string;
      dataset_title: string;
    }>;
    count: number;
  }> => {
    const response = await api.get('/public-data/datastore/predefined');
    return response.data;
  },

  getDatastoreResource: async (resourceId: string): Promise<{
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    total_records: number;
    sample: any[];
  }> => {
    const response = await api.get(`/public-data/datastore/${resourceId}`);
    return response.data;
  },

  searchDatastore: async (
    resourceId: string,
    limit: number = 100,
    offset: number = 0,
    filters?: Record<string, any>,
    q?: string,
    sort?: string
  ): Promise<{
    records: any[];
    total: number;
    fields: Array<{ id: string; type: string }>;
  }> => {
    const formData = new FormData();
    formData.append('resource_id', resourceId);
    formData.append('limit', limit.toString());
    formData.append('offset', offset.toString());
    if (filters) formData.append('filters', JSON.stringify(filters));
    if (q) formData.append('q', q);
    if (sort) formData.append('sort', sort);
    const response = await api.post('/public-data/datastore/search', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  searchDatastoreSQL: async (sqlQuery: string): Promise<{
    records: any[];
    fields: Array<{ id: string; type: string }>;
  }> => {
    const formData = new FormData();
    formData.append('sql_query', sqlQuery);
    const response = await api.post('/public-data/datastore/sql', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Social Aid
  explainSocialAid: async (
    question: string,
    context?: string,
    model: string = 'gemini-2.5-flash'
  ): Promise<ExplainSocialAidResponse> => {
    const formData = new FormData();
    formData.append('question', question);
    if (context) formData.append('context', context);
    formData.append('model', model);
    const response = await api.post('/public-data/explain-social-aid', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSocialAidDatasets: async (): Promise<{ datasets: Dataset[]; count: number }> => {
    const response = await api.get('/public-data/social-aid/datasets');
    return response.data;
  },

  // Aggregated View
  getDatasetAggregated: async (
    packageId: string,
    resourceIndex: number = 0,
    model: string = 'gemini-2.5-flash'
  ): Promise<{
    dataset: { id?: string; title?: string; name?: string; notes?: string };
    resource: { name?: string; format?: string; url?: string };
    structure: any;
    analysis: string;
  }> => {
    const params = new URLSearchParams();
    params.append('resource_index', resourceIndex.toString());
    params.append('model', model);
    const response = await api.get(`/public-data/datasets/${packageId}/aggregated?${params.toString()}`);
    return response.data;
  },
};

