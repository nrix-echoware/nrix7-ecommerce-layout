import { useState } from 'react';

export default function AdminKeyPrompt({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [key, setKey] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-xl font-medium mb-4">Enter Admin API Key</h3>
        <p className="text-sm text-gray-600 mb-3">
          Development key: <code className="bg-gray-100 px-2 py-1 rounded text-xs">dev-admin-key-123</code>
        </p>
        <input 
          className="w-full border rounded px-3 py-2 mb-4" 
          placeholder="Enter admin API key" 
          value={key} 
          onChange={(e) => setKey(e.target.value)} 
        />
        <div className="flex justify-end gap-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
            onClick={() => onSubmit(key)}
            disabled={!key.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
} 