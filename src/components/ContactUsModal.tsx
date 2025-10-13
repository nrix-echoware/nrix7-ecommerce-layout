import { useEffect, useState } from 'react';
import { submitContact } from '../api/contactusApi';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
  }, [isOpen, message]);

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Contact Us</DialogTitle>
          <DialogDescription>
            Share your query and we’ll get back to you. For urgent queries use the contact info below.
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
  );
} 