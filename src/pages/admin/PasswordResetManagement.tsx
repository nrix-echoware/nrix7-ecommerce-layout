import { useState } from 'react';
import { generatePasswordResetToken } from '../../api/usersApi';
import { Copy, Mail, Check, AlertCircle } from 'lucide-react';

interface PasswordResetManagementProps {
  onAuthError: () => void;
}

export default function PasswordResetManagement({ onAuthError }: PasswordResetManagementProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ resetLink: string; expiresAt: string } | null>(null);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await generatePasswordResetToken(email);
      setSuccess({
        resetLink: response.reset_link,
        expiresAt: response.expires_at,
      });
      setEmail('');
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        setError(err?.message || 'Failed to generate reset token');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-2">Password Reset Management</h1>
        <p className="text-neutral-600 text-sm">
          Generate password reset tokens for users. Users will receive a link they can use to reset their password.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4 sm:p-6">
        <form onSubmit={handleGenerateToken} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              User Email
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Generating...' : 'Generate Token'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">Reset token generated successfully!</p>
                <p className="text-xs text-green-700">Expires at: {new Date(success.expiresAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Reset Link</label>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={success.resetLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(success.resetLink)}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-green-200">
              <p className="text-xs text-green-700">
                <strong>Note:</strong> Share this link with the user via email. The link will expire in 24 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

