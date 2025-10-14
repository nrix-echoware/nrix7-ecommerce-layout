import React, { useState, Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { submitContact } from '../api/contactusApi';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  User,
  MessageSquare,
  Building,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

// Lazy load the heavy voice recorder component
const LazyVoiceRecorderOptimized = lazy(() => import('@/components/ui/lazy-voice-recorder-optimized').then(module => ({ 
  default: module.LazyVoiceRecorderOptimized 
})));

export default function Contact() {
  const config = useSelector((state: RootState) => state.siteConfig.config);
  const { user, isAuthenticated } = useAuth();
  
  // Get contact configuration with proper fallbacks
  const contactConfig = config.contact;
  const heroConfig = contactConfig?.hero;
  const storeConfig = contactConfig?.store;
  const formConfig = contactConfig?.form;
  const storeInfoConfig = contactConfig?.storeInfo;
  
  const [formData, setFormData] = useState({
    name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
    type: 'inquiry',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAudioData = (audioData: Blob) => {
    setAudioBlob(audioData);
    // For now, just store the audio blob
    // Later you can send it to backend or convert to text
    console.log('Audio recorded:', audioData.size, 'bytes');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!formData.message.trim() && !audioBlob) || !formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields or record a voice message');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const extras: Record<string, any> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };

      await submitContact({
        site: storeConfig?.name || config.shopName || 'Nrix7 Store',
        type: formData.type,
        message: formData.message + (audioBlob ? ' [Audio message attached]' : ''),
        extras: { ...extras, hasAudio: !!audioBlob }
      });

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
        email: user?.email || '',
        phone: user?.phone || '',
        type: 'inquiry',
        message: ''
      });
      setAudioBlob(null);
      
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast.error(error?.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get contact types from config
  const contactTypes = formConfig?.types || [
    { value: 'inquiry', label: 'General Inquiry' },
    { value: 'order_problem', label: 'Order Problem' },
    { value: 'return_exchange', label: 'Return/Exchange' },
    { value: 'bug_report', label: 'Bug Report' }
  ];

  // Get store info from config
  const storeInfo = (storeInfoConfig?.sections || []).map(section => ({
    icon: section.icon === 'MapPin' ? MapPin :
          section.icon === 'Phone' ? Phone :
          section.icon === 'Mail' ? Mail :
          section.icon === 'Clock' ? Clock : MapPin,
    title: section.title,
    details: section.details
  }));

  // Icon mapping function
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'MapPin': return MapPin;
      case 'Phone': return Phone;
      case 'Mail': return Mail;
      case 'Clock': return Clock;
      default: return MapPin;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {heroConfig.title || 'Get In Touch'}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {heroConfig.subtitle || "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
          </p>
        </div>
      </div>

      {/* Voice Message Section */}
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Send a Voice Message
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sometimes it's easier to say it than type it. Record a voice message and let us hear your thoughts directly.
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
              <p className="text-lg text-green-600 font-medium">
                ✓ Voice message recorded! It will be included with your contact form submission.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex min-h-screen">
        {/* Contact Form - 4 columns */}
        <div className="w-full lg:w-1/3 bg-gray-50 p-8 lg:p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-black mb-8">{formConfig?.title || 'Send us a Message'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formConfig?.fields?.name?.label || 'Full Name'} {formConfig?.fields?.name?.required ? '*' : ''}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={formConfig?.fields?.name?.required}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black placeholder-gray-500"
                    placeholder={formConfig?.fields?.name?.placeholder || 'Enter your full name'}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formConfig?.fields?.email?.label || 'Email Address'} {formConfig?.fields?.email?.required ? '*' : ''}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required={formConfig?.fields?.email?.required}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black placeholder-gray-500"
                    placeholder={formConfig?.fields?.email?.placeholder || 'Enter your email address'}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formConfig?.fields?.phone?.label || 'Phone Number'} {formConfig?.fields?.phone?.required ? '*' : ''}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required={formConfig?.fields?.phone?.required}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black placeholder-gray-500"
                    placeholder={formConfig?.fields?.phone?.placeholder || 'Enter your phone number'}
                  />
                </div>
              </div>

              {/* Contact Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formConfig?.fields?.type?.label || 'How can we help?'} {formConfig?.fields?.type?.required ? '*' : ''}
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required={formConfig?.fields?.type?.required}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black appearance-none"
                  >
                    {contactTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formConfig?.fields?.message?.label || 'Your Message'} {formConfig?.fields?.message?.required ? '*' : ''}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-4 text-gray-400 w-5 h-5" />
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required={formConfig?.fields?.message?.required}
                    rows={formConfig?.fields?.message?.rows || 6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white text-black placeholder-gray-500 resize-none"
                    placeholder={formConfig?.fields?.message?.placeholder || 'Tell us how we can help you...'}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {formConfig?.submit?.sending || 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {formConfig?.submit?.text || 'Send Message'}
                  </>
                )}
              </button>
            </form>

            {/* Store Information */}
            <div className="mt-12 space-y-6">
              <h3 className="text-xl font-bold text-black mb-6">{storeInfoConfig?.title || 'Store Information'}</h3>
              {storeInfo.map((info, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-black p-3 rounded-lg">
                    <info.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black mb-1">{info.title}</h4>
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-gray-600 text-sm">
                        {detail}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Google Maps - 8 columns */}
        <div className="w-full lg:w-2/3 bg-gray-100">
          <div className="h-full relative">
            {/* Map Container */}
            <div className="h-full w-full bg-gray-200">
              {storeConfig?.map?.embedUrl ? (
                /* Actual Google Maps Embed */
                <iframe
                  src={storeConfig.map.embedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Store Location Map"
                  className="w-full h-full"
                />
              ) : (
                /* Fallback Placeholder */
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Our Store Location</h3>
                    <p className="text-gray-500 mb-4">
                      {storeConfig?.address?.street}, {storeConfig?.address?.city}
                    </p>
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
                      <h4 className="font-semibold text-black mb-2">Interactive Map</h4>
                      <p className="text-sm text-gray-600">
                        {storeConfig?.map?.description || 'This will be replaced with an actual Google Maps integration showing our store location.'}
                      </p>
                      <div className="mt-4 bg-gray-100 h-32 rounded flex items-center justify-center">
                        <span className="text-gray-500">{storeConfig?.map?.placeholder || 'Google Maps Placeholder'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map Overlay Info */}
            <div className="absolute top-6 left-6 bg-white p-4 rounded-lg shadow-lg max-w-sm">
              <h4 className="font-bold text-black mb-2">{storeConfig?.map?.overlay?.title || 'Visit Our Store'}</h4>
              <p className="text-sm text-gray-600 mb-2">
                {storeConfig?.map?.overlay?.description || 'We\'re located in Rajbari, Dum Dum, Kolkata. Easy access by metro, bus, or car with parking available.'}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <Clock className="w-4 h-4" />
                <span>{storeConfig?.map?.overlay?.hours || 'Open 10 AM - 9 PM (Mon-Sat)'}</span>
              </div>
              {storeConfig?.map?.linkUrl && (
                <a
                  href={storeConfig.map.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Navigation className="w-4 h-4" />
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// https://www.google.com/maps/place/Rajbari,+Dum+Dum,+Kolkata,+West+Bengal/@22.64253,88.4143218,15z/data=!3m1!4b1!4m6!3m5!1s0x39f89e43db853bc5:0x762f48fc15d259c5!8m2!3d22.6429924!4d88.4223455!16s%2Fg%2F1ttdww36?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D