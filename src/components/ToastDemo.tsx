import React from 'react';
import { 
  toastSuccessWithLink, 
  toastInfoWithLink, 
  toastWarningWithLink, 
  toastErrorWithLink,
  ToastExamples 
} from '../lib/toast-utils';
import { Button } from './ui/button';
import { Volume2, HelpCircle, Bell, AlertTriangle } from 'lucide-react';

export function ToastDemo() {
  const handleNewFeatureToast = () => {
    ToastExamples.announceNewFeature('Voice Contact', '/voice-contact');
  };

  const handleVoiceContactPromo = () => {
    ToastExamples.promoteVoiceContact();
  };

  const handleHelpToast = () => {
    ToastExamples.showHelp('Voice Recording', '/help/voice-recording');
  };

  const handleUpdateToast = () => {
    ToastExamples.notifyUpdate('We\'ve added voice contact and improved accessibility features.', '/changelog');
  };

  const handleCustomSuccessToast = () => {
    toastSuccessWithLink(
      '🎉 Voice Message Sent!',
      'Your voice message has been successfully submitted. We\'ll get back to you soon.',
      {
        href: '/contact',
        text: 'Send Another Message',
        target: '_self'
      },
      {
        label: 'View Status',
        onClick: () => console.log('View message status')
      }
    );
  };

  const handleCustomInfoToast = () => {
    toastInfoWithLink(
      '💡 Pro Tip',
      'You can now use voice messages for faster communication. Perfect for detailed feedback!',
      {
        href: '/voice-contact',
        text: 'Try Voice Contact',
        target: '_self'
      }
    );
  };

  const handleCustomWarningToast = () => {
    toastWarningWithLink(
      '⚠️ Browser Compatibility',
      'Voice recording works best on modern browsers. If you\'re having issues, try updating your browser.',
      {
        href: '/help/browser-compatibility',
        text: 'Check Compatibility',
        target: '_blank'
      }
    );
  };

  const handleCustomErrorToast = () => {
    toastErrorWithLink(
      '❌ Recording Failed',
      'We couldn\'t access your microphone. Please check your browser permissions.',
      {
        href: '/help/microphone-permissions',
        text: 'Fix Microphone Issues',
        target: '_blank'
      },
      {
        label: 'Try Again',
        onClick: () => console.log('Retry recording')
      }
    );
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Toast with Links Demo</h2>
      <p className="text-gray-600 mb-8">
        Click the buttons below to see different types of toast notifications with embedded links.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Success Toasts */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Success Toasts
          </h3>
          <Button 
            onClick={handleNewFeatureToast}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            New Feature Announcement
          </Button>
          <Button 
            onClick={handleCustomSuccessToast}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            Voice Message Sent
          </Button>
        </div>

        {/* Info Toasts */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-blue-600 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Info Toasts
          </h3>
          <Button 
            onClick={handleVoiceContactPromo}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Voice Contact Promotion
          </Button>
          <Button 
            onClick={handleCustomInfoToast}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Pro Tip
          </Button>
        </div>

        {/* Warning Toasts */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Warning Toasts
          </h3>
          <Button 
            onClick={handleCustomWarningToast}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Browser Compatibility
          </Button>
        </div>

        {/* Error Toasts */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Error Toasts
          </h3>
          <Button 
            onClick={handleCustomErrorToast}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            Recording Failed
          </Button>
        </div>
      </div>

      {/* Additional Examples */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleHelpToast}
            variant="outline"
            className="w-full"
          >
            Help Documentation
          </Button>
          <Button 
            onClick={handleUpdateToast}
            variant="outline"
            className="w-full"
          >
            Update Notification
          </Button>
        </div>
      </div>
    </div>
  );
}
