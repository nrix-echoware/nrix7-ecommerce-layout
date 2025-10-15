import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:9997';

export interface AudioContactRequest {
  email: string;
  name: string;
  phone?: string;
  audio_data: string; // Base64 encoded audio data
  duration: number;
  mime_type: string;
}

export interface AudioContactResponse {
  id: number;
  message: string;
  created_at: string;
}

export const submitAudioContact = async (data: AudioContactRequest): Promise<AudioContactResponse> => {
  console.log('Submitting audio contact to:', `${API_BASE_URL}/api/audio-contact`);
  console.log('Request data:', {
    email: data.email,
    name: data.name,
    phone: data.phone,
    duration: data.duration,
    mime_type: data.mime_type,
    audio_data_length: data.audio_data.length
  });
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/audio-contact`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout for large audio files
    });
    console.log('Audio contact submission response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Audio contact submission error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request config:', error.config);
    }
    throw error;
  }
};

export const getAudioFile = async (id: number): Promise<Blob> => {
  const response = await axios.get(`${API_BASE_URL}/api/audio/${id}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Admin API functions
export const getAudioContacts = async (limit = 20, offset = 0): Promise<any> => {
  const adminKey = sessionStorage.getItem('admin_api_key');
  const response = await axios.get(`${API_BASE_URL}/api/admin/audio-contacts`, {
    params: { limit, offset },
    headers: {
      'X-Admin-API-Key': adminKey || '',
    },
  });
  return response.data;
};

export const getAudioContactsByStatus = async (status: string, limit = 20, offset = 0): Promise<any> => {
  const adminKey = sessionStorage.getItem('admin_api_key');
  const response = await axios.get(`${API_BASE_URL}/api/admin/audio-contacts/status/${status}`, {
    params: { limit, offset },
    headers: {
      'X-Admin-API-Key': adminKey || '',
    },
  });
  return response.data;
};

export const getAudioContact = async (id: number): Promise<any> => {
  const adminKey = sessionStorage.getItem('admin_api_key');
  const response = await axios.get(`${API_BASE_URL}/api/admin/audio-contacts/${id}`, {
    headers: {
      'X-Admin-API-Key': adminKey || '',
    },
  });
  return response.data;
};

export const updateAudioContactStatus = async (id: number, status: string, notes?: string): Promise<void> => {
  const adminKey = sessionStorage.getItem('admin_api_key');
  await axios.put(`${API_BASE_URL}/api/admin/audio-contacts/${id}/status`, {
    status,
    notes,
  }, {
    headers: {
      'X-Admin-API-Key': adminKey || '',
    },
  });
};

export const deleteAudioContact = async (id: number): Promise<void> => {
  const adminKey = sessionStorage.getItem('admin_api_key');
  await axios.delete(`${API_BASE_URL}/api/admin/audio-contacts/${id}`, {
    headers: {
      'X-Admin-API-Key': adminKey || '',
    },
  });
};

export const getAudioContactStats = async (): Promise<any> => {
  const adminKey = sessionStorage.getItem('admin_api_key');
  const response = await axios.get(`${API_BASE_URL}/api/admin/audio-contacts/stats`, {
    headers: {
      'X-Admin-API-Key': adminKey || '',
    },
  });
  return response.data;
};
