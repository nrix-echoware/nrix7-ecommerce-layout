import React from 'react';

interface CTAButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const CTAButton: React.FC<CTAButtonProps> = ({ children, href, onClick, className }) => {
  return href ? (
    <a
      href={href}
      className={`inline-block px-8 py-3 rounded font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-lg relative group ${className}`}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute left-0 bottom-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
    </a>
  ) : (
    <button
      className={`inline-block px-8 py-3 rounded font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-lg relative group ${className}`}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute left-0 bottom-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
    </button>
  );
};

export default CTAButton;
