import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip, Loader2 } from 'lucide-react';
import { getThreadByOrderId, getMessages, createMessage, Thread, Message } from '../api/chatApi';
import { sseService, SSEMessage } from '../services/sseService';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface OrderChatWidgetProps {
  orderId: string;
  isAdmin?: boolean;
  currentUserId?: string;
}

export default function OrderChatWidget({ orderId, isAdmin = false, currentUserId }: OrderChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isThreadClosed, setIsThreadClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadThread();
  }, [orderId]);

  useEffect(() => {
    if (isOpen && thread) {
      loadMessages();
    }
  }, [isOpen, thread]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const unsubscribe = sseService.onAdminEvent((event: SSEMessage) => {
      if (event.resource_type === 'messages.new' && event.data.order_id === orderId) {
        if (thread && event.data.thread_id === thread.thread_id) {
          handleNewMessage(event);
        }
      }
    });

    if (!isAdmin) {
      const userUnsubscribe = sseService.onUserEvent((event: SSEMessage) => {
        if (event.resource_type === 'messages.new' && event.data.order_id === orderId) {
          if (thread && event.data.thread_id === thread.thread_id) {
            handleNewMessage(event);
          }
        }
      });

      return () => {
        unsubscribe();
        userUnsubscribe();
      };
    }

    return unsubscribe;
  }, [orderId, thread, isAdmin]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const t = await getThreadByOrderId(orderId, isAdmin);
      setThread(t);
      setIsThreadClosed(!t.is_active);
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!thread) return;
    try {
      const response = await getMessages(thread.thread_id, 0, 100, isAdmin);
      setMessages(response.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleNewMessage = async (event: SSEMessage) => {
    if (!thread || event.data.thread_id !== thread.thread_id) return;
    
    await loadMessages();
    
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleSend = async () => {
    if (!thread || (!input.trim() && !selectedFile) || sending) return;
    if (isThreadClosed) return;

    const messageContent = input.trim();
    setSending(true);
    setInput('');
    
    const owner = isAdmin ? 'admin' : 'user';
    const tempId = `temp-${Date.now()}`;
    
    const tempMessage: Message = {
      message_id: tempId,
      thread_id: thread.thread_id,
      message_content: messageContent,
      owner: owner as 'user' | 'admin',
      created_at: new Date().toISOString(),
      has_media: !!selectedFile,
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const newMessage = await createMessage(thread.thread_id, messageContent, owner as 'user' | 'admin', selectedFile || undefined);
      setMessages(prev => prev.filter(m => m.message_id !== tempId).concat(newMessage));
      setSelectedFile(null);
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.message_id !== tempId));
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="fixed bottom-6 right-6">
        <Button size="icon" variant="default" disabled>
          <Loader2 className="h-5 w-5 animate-spin" />
        </Button>
      </div>
    );
  }

  if (!thread) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="icon"
            variant="default"
            className="rounded-full h-14 w-14 shadow-lg relative"
            onClick={() => {
              setIsOpen(true);
              setUnreadCount(0);
            }}
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Order Chat</h3>
              <p className="text-xs text-blue-100">Order: {orderId.slice(0, 8)}...</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {isThreadClosed && (
            <div className="p-3 bg-yellow-50 border-b border-yellow-200 text-center">
              <p className="text-sm text-yellow-800">Thread closed by admin</p>
            </div>
          )}

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.owner === (isAdmin ? 'admin' : 'user');
                return (
                  <div
                    key={msg.message_id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.message_content}</p>
                      {msg.has_media && (
                        <p className="text-xs mt-1 opacity-75">📎 Attachment</p>
                      )}
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {!isThreadClosed && (
            <div className="p-4 border-t space-y-2">
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Paperclip className="h-4 w-4" />
                  <span className="truncate flex-1">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,video/*"
                />
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[60px]"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || (!input.trim() && !selectedFile)}
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

