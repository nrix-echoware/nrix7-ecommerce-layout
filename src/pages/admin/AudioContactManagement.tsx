import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, Trash2, CheckCircle, Clock, Archive, User, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getAudioContacts, 
  getAudioContactsByStatus, 
  updateAudioContactStatus, 
  deleteAudioContact, 
  getAudioContactStats,
  API_BASE_URL
} from '../../api/audioContactApi';

interface AudioContact {
  id: number;
  user_id?: number;
  email: string;
  name: string;
  phone?: string;
  duration: number;
  file_size: number;
  mime_type: string;
  status: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
  audio_url: string;
}

interface AudioContactManagementProps {
  onAuthError: () => void;
}

export default function AudioContactManagement({ onAuthError }: AudioContactManagementProps) {
  const [audioContacts, setAudioContacts] = useState<AudioContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  useEffect(() => {
    fetchAudioContacts();
    fetchStats();
  }, [selectedStatus]);

  const fetchAudioContacts = async () => {
    try {
      setLoading(true);
      const data = selectedStatus === 'all' 
        ? await getAudioContacts(20, 0)
        : await getAudioContactsByStatus(selectedStatus, 20, 0);
      
      setAudioContacts(data.data || []);
    } catch (error: any) {
      console.error('Error fetching audio contacts:', error);
      if (error?.response?.status === 401 || error?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        toast.error('Failed to fetch audio contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getAudioContactStats();
      setStats(data.stats || {});
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error?.response?.status === 401 || error?.message?.includes('Admin key required')) {
        onAuthError();
      }
    }
  };

  const updateStatus = async (id: number, status: string, notes?: string) => {
    try {
      setUpdatingStatusId(id);
      await updateAudioContactStatus(id, status, notes || '');
      toast.success('Status updated successfully');
      fetchAudioContacts();
      fetchStats();
    } catch (error: any) {
      console.error('Error updating status:', error);
      if (error?.response?.status === 401 || error?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        toast.error('Failed to update status');
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteAudioContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this audio contact?')) {
      return;
    }

    try {
      await deleteAudioContact(id);
      toast.success('Audio contact deleted successfully');
      fetchAudioContacts();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting audio contact:', error);
      if (error?.response?.status === 401 || error?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        toast.error('Failed to delete audio contact');
      }
    }
  };

  const playAudio = (audioContact: AudioContact) => {
    if (currentPlayingId === audioContact.id) {
      // Pause current audio
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
        setCurrentPlayingId(null);
      }
    } else {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
      }

      // Play new audio
      const audioUrl = API_BASE_URL + "/" + audioContact.audio_url.split("/").splice(-3).join("/"); 
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => {
        setCurrentPlayingId(null);
        setAudioElement(null);
      });
      
      audio.play();
      setAudioElement(audio);
      setCurrentPlayingId(audioContact.id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Audio Contact Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage voice messages from customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processed || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Archive className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-900">{stats.archived || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Audio Contacts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading audio contacts...</p>
          </div>
        ) : audioContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audio contacts found
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {audioContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => playAudio(contact)}
                            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                          >
                            {currentPlayingId === contact.id ? (
                              <Pause className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Play className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                          <div className="text-sm text-gray-600">
                            <div>{formatDuration(contact.duration)}</div>
                            <div className="text-xs text-gray-500">{formatFileSize(contact.file_size)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                          {getStatusIcon(contact.status)}
                          <span className="ml-1 capitalize">{contact.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(contact.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <select
                            value={contact.status}
                            onChange={(e) => updateStatus(contact.id, e.target.value)}
                            disabled={updatingStatusId === contact.id}
                            className={`px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              updatingStatusId === contact.id ? 'opacity-50 cursor-not-allowed' : ''
                            } ${
                              contact.status === 'pending' ? 'bg-yellow-50 border-yellow-300' :
                              contact.status === 'processed' ? 'bg-green-50 border-green-300' :
                              'bg-gray-50 border-gray-300'
                            }`}
                          >
                            <option value="pending">🟡 Pending</option>
                            <option value="processed">✅ Processed</option>
                            <option value="archived">📁 Archived</option>
                          </select>
                          {updatingStatusId === contact.id && (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          <button
                            onClick={() => handleDeleteAudioContact(contact.id)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="Delete audio contact"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3 px-4 pb-4">
              {audioContacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {getStatusIcon(contact.status)}
                      <span className="ml-1 capitalize">{contact.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playAudio(contact)}
                      className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      {currentPlayingId === contact.id ? (
                        <Pause className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Play className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                    <div className="text-sm text-gray-600">
                      <div>{formatDuration(contact.duration)}</div>
                      <div className="text-xs text-gray-500">{formatFileSize(contact.file_size)}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <select
                      value={contact.status}
                      onChange={(e) => updateStatus(contact.id, e.target.value)}
                      disabled={updatingStatusId === contact.id}
                      className={`px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        contact.status === 'pending' ? 'bg-yellow-50 border-yellow-300' :
                        contact.status === 'processed' ? 'bg-green-50 border-green-300' :
                        'bg-gray-50 border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <option value="pending">🟡 Pending</option>
                      <option value="processed">✅ Processed</option>
                      <option value="archived">📁 Archived</option>
                    </select>
                    <button
                      onClick={() => handleDeleteAudioContact(contact.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(contact.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
