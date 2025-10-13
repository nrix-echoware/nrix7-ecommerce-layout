import { useEffect, useRef, useState } from 'react';
import { AnimationController } from '../utils/animations';
import { ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import ContactUsModal from '../components/ContactUsModal';

const Policies = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const faq = useSelector((s: RootState) => s.siteConfig.config.faq);
  const owner = useSelector((s: RootState) => s.siteConfig.config.storeOwner);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (pageRef.current) {
      AnimationController.pageTransition(pageRef.current, 'in');
    }
  }, []);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    const contentElement = document.getElementById(`content-${id}`);
    const iconElement = document.getElementById(`icon-${id}`);

    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
      if (contentElement && iconElement) {
        gsap.to(contentElement, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.inOut"
        });
        gsap.to(iconElement, {
          rotation: 0,
          duration: 0.3,
          ease: "power2.inOut"
        });
      }
    } else {
      newOpenItems.add(id);
      if (contentElement && iconElement) {
        gsap.set(contentElement, { height: 'auto' });
        const autoHeight = contentElement.offsetHeight;
        gsap.fromTo(contentElement,
          { height: 0, opacity: 0 },
          {
            height: autoHeight,
            opacity: 1,
            duration: 0.3,
            ease: "power2.inOut"
          }
        );
        gsap.to(iconElement, {
          rotation: 180,
          duration: 0.3,
          ease: "power2.inOut"
        });
      }
    }

    setOpenItems(newOpenItems);
  };

  return (
    <div className="min-h-screen pt-20 md:pt-16 pb-16 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div ref={pageRef}>
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light mb-6 text-neutral-900">
              Policies & FAQ
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about shopping with us, returns, delivery, and more.
            </p>
          </div>

          <div className="space-y-4">
            {(faq || []).map((item, idx) => {
              const id = `faq-${idx}`;
              return (
                <div
                  key={id}
                  className="border border-neutral-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-lg font-medium text-neutral-900">
                      {item.question}
                    </span>
                    <ChevronDown
                      id={`icon-${id}`}
                      size={20}
                      className="text-neutral-500 transition-transform duration-300"
                    />
                  </button>
                  
                  <div
                    id={`content-${id}`}
                    className="overflow-hidden"
                    style={{ height: 0, opacity: 0 }}
                  >
                    <div className="px-6 pb-4">
                      <p className="text-neutral-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-16 pt-12 border-t border-neutral-200">
            <h2 className="text-2xl font-light mb-4 text-neutral-900">
              Still have questions?
            </h2>
            <p className="text-neutral-600 mb-4">
              Can't find what you're looking for? Our customer support team is here to help.
            </p>
            {owner && (owner.email || owner.phone) && (
              <p className="text-sm text-neutral-600 mb-6">For urgent queries contact {owner.name ? owner.name + ' at ' : ''}
                {owner.email && (<a className="underline" href={`mailto:${owner.email}`}>{owner.email}</a>)}
                {(owner.email && owner.phone) && ' or '}
                {owner.phone && (<a className="underline" href={`tel:${owner.phone}`}>{owner.phone}</a>)}
              </p>
            )}
            <button
              onClick={() => setContactOpen(true)}
              className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
            >
              Contact Us
            </button>
            <ContactUsModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
