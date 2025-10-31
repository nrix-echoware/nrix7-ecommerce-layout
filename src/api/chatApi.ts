import { TokenManager } from "./authApi";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9997';

export interface Thread {
  thread_id: string;
  order_id: string;
  updated_at: string;
  is_active: boolean;
  created_at: string;
}

export interface Message {
  message_id: string;
  thread_id: string;
  message_content: string;
  owner: "user" | "admin";
  created_at: string;
  has_media: boolean;
}

export interface GetMessagesResponse {
  messages: Message[];
  total: number;
  skip: number;
  take: number;
}

export async function getThreadByOrderId(orderId: string, isAdmin: boolean = false) {
  const token = TokenManager.getAccessToken();
  const adminKey = sessionStorage.getItem('admin_api_key');
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (isAdmin && adminKey) {
    headers["X-Admin-API-Key"] = adminKey;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const endpoint = isAdmin 
    ? `${API_BASE}/admin/threads/${orderId}`
    : `${API_BASE}/user/threads/${orderId}`;
    
  const res = await fetch(endpoint, { headers });
  if (!res.ok) throw new Error(`getThreadByOrderId failed: ${res.status}`);
  return res.json() as Promise<Thread>;
}

export async function getMessages(threadId: string, skip = 0, take = 50, isAdmin: boolean = false) {
  const token = TokenManager.getAccessToken();
  const adminKey = sessionStorage.getItem('admin_api_key');
  
  const headers: HeadersInit = {};
  
  if (isAdmin && adminKey) {
    headers["X-Admin-API-Key"] = adminKey;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const endpoint = isAdmin
    ? `${API_BASE}/admin/messages/${threadId}?skip=${skip}&take=${take}`
    : `${API_BASE}/user/messages/${threadId}?skip=${skip}&take=${take}`;
    
  const res = await fetch(endpoint, { headers });
  if (!res.ok) throw new Error(`getMessages failed: ${res.status}`);
  return res.json() as Promise<GetMessagesResponse>;
}

export async function createMessage(
  threadId: string,
  messageContent: string,
  owner: "user" | "admin",
  mediaFile?: File
) {
  const token = TokenManager.getAccessToken();
  const adminKey = sessionStorage.getItem('admin_api_key');
  
  const isAdmin = owner === "admin";
  const endpoint = isAdmin
    ? `${API_BASE}/admin/messages`
    : `${API_BASE}/user/messages`;

  if (mediaFile) {
    const formData = new FormData();
    formData.append("thread_id", threadId);
    formData.append("message_content", messageContent);
    formData.append("owner", owner);
    formData.append("media", mediaFile);

    const headers: HeadersInit = {};
    if (isAdmin && adminKey) {
      headers["X-Admin-API-Key"] = adminKey;
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`createMessage failed: ${res.status}`);
    return res.json() as Promise<Message>;
  } else {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (isAdmin && adminKey) {
      headers["X-Admin-API-Key"] = adminKey;
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        thread_id: threadId,
        message_content: messageContent,
        owner,
      }),
    });
    if (!res.ok) throw new Error(`createMessage failed: ${res.status}`);
    return res.json() as Promise<Message>;
  }
}

export async function closeThread(threadId: string) {
  const adminKey = sessionStorage.getItem('admin_api_key');
  if (!adminKey) throw new Error("Admin key required");
  
  const res = await fetch(`${API_BASE}/admin/threads/${threadId}/close`, {
    method: "POST",
    headers: {
      "X-Admin-API-Key": adminKey,
    },
  });
  if (!res.ok) throw new Error(`closeThread failed: ${res.status}`);
  return res.json();
}

