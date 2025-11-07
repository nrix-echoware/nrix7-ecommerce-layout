import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

export async function logVisitor(path: string, referrer?: string, extras?: Record<string, any>): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/analytics/visitor`, {
      path,
      referrer: referrer || document.referrer || '',
      extras: extras || {}
    });
  } catch (e) {
    // Swallow analytics errors
  }
} 