import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9997';

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