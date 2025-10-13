import React from 'react';
import { Link } from 'react-router-dom';

interface CTAButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const CTAButton: React.FC<CTAButtonProps> = ({ children, href, onClick, className }) => {
  // If href is a relative path, use Link; otherwise, use <a>
  const isInternal = href && href.startsWith('/');
  const buttonClasses = `inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base rounded font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-lg relative group ${className}`;
  
  if (isInternal && href) {
    return (
      <Link
        to={href}
        className={buttonClasses}
        onClick={onClick}
      >
        <span className="relative z-10">{children}</span>
        <span className="absolute left-0 bottom-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
      </Link>
    );
  }
  return href ? (
    <a
      href={href}
      className={buttonClasses}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute left-0 bottom-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
    </a>
  ) : (
    <button
      className={buttonClasses}
      onClick={onClick}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute left-0 bottom-0 w-0 h-1 bg-white group-hover:w-full transition-all duration-300" />
    </button>
  );
};

export default CTAButton;
