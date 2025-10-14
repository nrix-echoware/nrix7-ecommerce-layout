import React, { useState, Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { submitContact } from '../api/contactusApi';
import { 
  ArrowLeft,
  Mic,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  User,
  Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { toastSuccessWithLink, toastErrorWithLink } from '../lib/toast-utils';

// Lazy load the heavy voice recorder component
const LazyVoiceRecorderOptimized = lazy(() => import('@/components/ui/lazy-voice-recorder-optimized').then(module => ({ 
  default: module.LazyVoiceRecorderOptimized 
})));

export default function VoiceContact() {
  const navigate = useNavigate();
  const config = useSelector((state: RootState) => state.siteConfig.config);
  const { user, isAuthenticated } = useAuth();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAudioData = (audioData: Blob) => {
    setAudioBlob(audioData);
    console.log('Audio recorded:', audioData.size, 'bytes');
  };

  const handleSubmitVoiceMessage = async () => {
    if (!audioBlob) {
      toast.error('Please record a voice message first');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to submit voice messages');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const extras: Record<string, any> = {
        name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : 'Voice Contact User',
        email: user?.email || '',
        phone: user?.phone || '',
        hasAudio: true,
        contactType: 'voice_message'
      };

      await submitContact({
        site: config.shopName || 'Nrix7 Store',
        type: 'voice_inquiry',
        message: 'Voice message from user - audio file attached',
        extras
      });

      toast.success('Voice message submitted successfully! We\'ll get back to you soon.');
      setAudioBlob(null);
      
    } catch (error: any) {
      console.error('Voice contact error:', error);
      toast.error(error?.response?.data?.error || 'Failed to submit voice message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/contact')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 hover:gap-3 transition-all"
          >
            <ArrowLeft size={20} />
            Back to Contact
          </button>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Send us a voice message
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Speak directly to us! Record a voice message and we'll listen to your thoughts, questions, or feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Recorder Section */}
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Record Your Message
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sometimes it's easier to say it than type it. Click the microphone below and share your thoughts with us directly.
            </p>
          </div>
          
          <Suspense fallback={
            <div className="w-[90%] mx-auto h-[40rem] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-light mb-2">Loading Voice Recorder...</h3>
                <p className="text-white/80">Preparing audio components</p>
              </div>
            </div>
          }>
            <LazyVoiceRecorderOptimized 
              onAudioData={handleAudioData}
              className="w-[90%] mx-auto h-[40rem]"
              isAuthenticated={isAuthenticated}
              user={user}
            />
          </Suspense>
          
          {audioBlob && (
            <div className="mt-8 text-center">
              <p className="text-lg text-green-600 font-medium mb-4">
                ✓ Voice message recorded! Ready to submit.
              </p>
              <button
                onClick={handleSubmitVoiceMessage}
                disabled={isSubmitting || !isAuthenticated}
                className={`px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300 hover:scale-105 ${
                  isAuthenticated 
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-2xl hover:shadow-green-500/50' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white shadow-2xl cursor-not-allowed opacity-75'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5 inline-block mr-2" />
                    Submit Voice Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Use Voice Contact?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Perfect for users who prefer speaking over typing
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-gray-600">
                Simply click and speak. No need to type or navigate complex forms.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Natural Communication</h3>
              <p className="text-gray-600">
                Express your thoughts naturally through voice, just like a phone call.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessible</h3>
              <p className="text-gray-600">
                Great for users with mobility issues or those who prefer speaking.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
