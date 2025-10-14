import { useEffect, useState, Suspense, lazy } from 'react';
import { submitContact } from '../api/contactusApi';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useUserEmail } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Lazy load heavy dialog components
const Dialog = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.Dialog })));
const DialogContent = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogContent })));
const DialogHeader = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogHeader })));
const DialogTitle = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogTitle })));
const DialogDescription = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogDescription })));
const DialogFooter = lazy(() => import('@/components/ui/dialog').then(module => ({ default: module.DialogFooter })));
const Select = lazy(() => import('@/components/ui/select').then(module => ({ default: module.Select })));
const SelectTrigger = lazy(() => import('@/components/ui/select').then(module => ({ default: module.SelectTrigger })));
const SelectValue = lazy(() => import('@/components/ui/select').then(module => ({ default: module.SelectValue })));
const SelectContent = lazy(() => import('@/components/ui/select').then(module => ({ default: module.SelectContent })));
const SelectItem = lazy(() => import('@/components/ui/select').then(module => ({ default: module.SelectItem })));

interface Props {
  isOpen: boolean;
  onClose: () => void;
  site?: string;
  message?: string;
}

const REASONS = [
  { value: 'inquiry', label: 'General Inquiry' },
  { value: 'order_problem', label: 'Order Problem' },
  { value: 'return_exchange', label: 'Return/Exchange' },
  { value: 'bug_report', label: 'Bug Report' },
];

export default function ContactUsModal({ isOpen, onClose, site = 'shop', message = '' }: Props) {
  const owner = useSelector((s: RootState) => s.siteConfig.config.storeOwner);
  const userEmail = useUserEmail();
  const [type, setType] = useState('inquiry');
  const [messageText, setMessageText] = useState(message || '');
  const [extras, setExtras] = useState<Record<string, any>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // When opening, set the message from prop
      setMessageText(message || '');
      // Auto-fill email if user is logged in
      if (userEmail) {
        setEmail(userEmail);
      }
    } else {
      // When closing, reset everything
      setType('inquiry');
      setMessageText('');
      setExtras({});
      setName('');
      setEmail('');
      setPhone('');
      setSubmitting(false);
    }
  }, [isOpen, message, userEmail]);

  const reasonFields = () => {
    switch (type) {
      case 'order_problem':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-neutral-700">Order ID</Label>
              <Input value={extras.orderId || ''} onChange={(e) => setExtras({ ...extras, orderId: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm text-neutral-700">Issue</Label>
              <Select value={extras.issue || ''} onValueChange={(v) => setExtras({ ...extras, issue: v })}>
                <SelectTrigger><SelectValue placeholder="Select issue" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="delayed">Delivery delayed</SelectItem>
                  <SelectItem value="missing_items">Missing items</SelectItem>
                  <SelectItem value="damaged">Item damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'return_exchange':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-neutral-700">Order ID</Label>
              <Input value={extras.orderId || ''} onChange={(e) => setExtras({ ...extras, orderId: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm text-neutral-700">Reason</Label>
              <Select value={extras.reason || ''} onValueChange={(v) => setExtras({ ...extras, reason: v })}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="size_issue">Size issue</SelectItem>
                  <SelectItem value="quality_concern">Quality concern</SelectItem>
                  <SelectItem value="wrong_item">Wrong item received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'bug_report':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-neutral-700">Page URL</Label>
              <Input value={extras.url || ''} onChange={(e) => setExtras({ ...extras, url: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm text-neutral-700">Browser</Label>
              <Input value={extras.browser || ''} onChange={(e) => setExtras({ ...extras, browser: e.target.value })} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const onSubmit = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      toast.error('Provide at least email or phone');
      return;
    }
    setSubmitting(true);
    try {
      await submitContact({ site, type, message: messageText, extras: { ...extras, name, email, phone } });
      toast.success('Thank you! We will get back to you shortly.');
      onClose();
    } catch (e: any) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
            <span>Loading contact form...</span>
          </div>
        </div>
      </div>
    }>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>
              Share your query and we'll get back to you. For urgent queries use the contact info below.
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-sm text-neutral-700">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm text-neutral-700">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm text-neutral-700">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="mt-2 space-y-3">
          <div>
            <Label className="text-sm text-neutral-700">Reason</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {reasonFields()}

        <div className="mt-2">
          <Label className="text-sm text-neutral-700">Message</Label>
          <Textarea rows={4} value={messageText} onChange={(e) => setMessageText(e.target.value)} />
        </div>

        {owner && (owner.email || owner.phone) && (
          <div className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 rounded p-3 mt-2">
            For urgent queries contact {owner.name ? owner.name + ' at ' : ''}
            {owner.email && (<a className="underline" href={`mailto:${owner.email}`}>{owner.email}</a>)}
            {(owner.email && owner.phone) && ' or '}
            {owner.phone && (<a className="underline" href={`tel:${owner.phone}`}>{owner.phone}</a>)}
          </div>
        )}

        <DialogFooter className="gap-2 mt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>{submitting ? 'Sending…' : 'Send'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </Suspense>
  );
} 