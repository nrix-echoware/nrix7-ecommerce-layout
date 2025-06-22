import { useEffect, useRef, useState } from 'react';
import { AnimationController } from '../utils/animations';
import { ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';

interface PolicyItem {
  id: string;
  question: string;
  answer: string;
}

const policies: PolicyItem[] = [
  {
    id: 'return-policy',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for all items in their original condition. Items must be unworn, unwashed, and include all original tags and packaging. Return shipping costs are covered by us if the item is defective or not as described.'
  },
  {
    id: 'delivery-time',
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 3-7 business days within the country. Express delivery (1-2 business days) is available for an additional fee. International shipping takes 7-14 business days depending on the destination.'
  },
  {
    id: 'cod-available',
    question: 'Is Cash on Delivery (COD) available?',
    answer: 'Yes, Cash on Delivery is available for orders within the country. COD orders require a minimum order value of ₹25. Please note that COD orders cannot be cancelled once shipped.'
  },
  {
    id: 'data-handling',
    question: 'How is my personal data handled?',
    answer: 'We take your privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties without your consent. You can request to view, modify, or delete your data at any time by contacting our support team.'
  },
  {
    id: 'warranty',
    question: 'Do you offer product warranties?',
    answer: 'Electronics come with a 1-year manufacturer warranty covering defects. Fashion items are covered for manufacturing defects for 90 days. Normal wear and tear is not covered under warranty.'
  },
  {
    id: 'size-guide',
    question: 'How do I choose the right size?',
    answer: 'Each product page includes detailed size charts and measurements. For fashion items, we recommend measuring yourself and comparing with our size guide. If you\'re between sizes, we generally recommend sizing up for a more comfortable fit.'
  },
  {
    id: 'payment-security',
    question: 'Is my payment information secure?',
    answer: 'Yes, all payment transactions are secured with SSL encryption. We use trusted payment gateways and never store your complete payment information on our servers. Your financial data is protected with industry-standard security measures.'
  },
  {
    id: 'bulk-orders',
    question: 'Do you offer discounts for bulk orders?',
    answer: 'Yes, we offer special pricing for bulk orders (10+ items). Contact our sales team at bulk@ethereal.com with your requirements for a custom quote. Corporate accounts are also available with additional benefits.'
  }
];

const Policies = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

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
      // Close
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
      // Open
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
    <div className="min-h-screen pt-24 pb-16 bg-white">
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
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="border border-neutral-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(policy.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-lg font-medium text-neutral-900">
                    {policy.question}
                  </span>
                  <ChevronDown
                    id={`icon-${policy.id}`}
                    size={20}
                    className="text-neutral-500 transition-transform duration-300"
                  />
                </button>
                
                <div
                  id={`content-${policy.id}`}
                  className="overflow-hidden"
                  style={{ height: 0, opacity: 0 }}
                >
                  <div className="px-6 pb-4">
                    <p className="text-neutral-600 leading-relaxed">
                      {policy.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 pt-12 border-t border-neutral-200">
            <h2 className="text-2xl font-light mb-4 text-neutral-900">
              Still have questions?
            </h2>
            <p className="text-neutral-600 mb-6">
              Can't find what you're looking for? Our customer support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@ethereal.com"
                className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
              >
                Email Support
              </a>
              <a
                href="tel:+1234567890"
                className="inline-block border border-neutral-900 text-neutral-900 px-8 py-3 rounded font-medium hover:bg-neutral-900 hover:text-white transition-colors"
              >
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
