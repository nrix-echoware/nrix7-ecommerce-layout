import React, { useState } from 'react';
import { Eye, EyeOff, ShoppingCart, Shield, Truck, Headphones, RotateCcw, Star } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

// --- TYPE DEFINITIONS ---

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  features?: Feature[];
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignUp?: () => void;
  onSignIn?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-50/50">
    {children}
  </div>
);

const FeatureCard = ({ feature, delay }: { feature: Feature, delay: string }) => {
  const getIcon = (iconName: string) => {
    const iconProps = { className: "w-6 h-6 text-violet-600" };
    switch (iconName) {
      case 'ShoppingCart': return <ShoppingCart {...iconProps} />;
      case 'Shield': return <Shield {...iconProps} />;
      case 'Truck': return <Truck {...iconProps} />;
      case 'Headphones': return <Headphones {...iconProps} />;
      case 'RotateCcw': return <RotateCcw {...iconProps} />;
      case 'Star': return <Star {...iconProps} />;
      default: return <Star {...iconProps} />;
    }
  };

  return (
    <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-white/90 backdrop-blur-xl border border-gray-200/50 p-5 w-64 shadow-lg`}>
      <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center">
        {getIcon(feature.icon)}
      </div>
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium text-gray-900">{feature.title}</p>
        <p className="mt-1 text-gray-700">{feature.description}</p>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-gray-900 tracking-tighter">Join Us</span>,
  description = "Create your account and start your journey with us",
  heroImageSrc,
  features = [],
  onSignUp,
  onGoogleSignUp,
  onSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-gray-900">{title}</h1>
            <p className="animate-element animate-delay-200 text-gray-600">{description}</p>

            <form className="space-y-5" onSubmit={onSignUp}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-gray-900 placeholder-gray-500" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-gray-900 placeholder-gray-500" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" /> : <Eye className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-gray-900 placeholder-gray-500" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" /> : <Eye className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-600 flex items-center text-sm gap-3">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  name="agreeTerms"
                  className="h-4 w-4 rounded border-gray-300 accent-violet-600"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label htmlFor="agreeTerms" className="cursor-pointer text-gray-700 select-none">
                  I agree to the{' '}
                  <a href="/policies" target="_blank" className="text-violet-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </a>{' '}and{' '}
                  <a href="/policies" target="_blank" className="text-violet-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button type="submit" className="animate-element animate-delay-700 w-full rounded-2xl bg-violet-600 py-4 font-medium text-white hover:bg-violet-700 transition-colors">
                Create Account
              </button>
            </form>

            <div className="animate-element animate-delay-800 relative flex items-center justify-center">
              <span className="w-full border-t border-gray-300"></span>
              <span className="px-4 text-sm text-gray-600 bg-gradient-to-br from-gray-50 to-blue-50 absolute">Or continue with</span>
            </div>

            <button onClick={onGoogleSignUp} className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border border-gray-300 rounded-2xl py-4 hover:bg-gray-50 transition-colors text-gray-700">
                <GoogleIcon />
                Continue with Google
            </button>

            <p className="animate-element animate-delay-1000 text-center text-sm text-gray-600">
              Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSignIn?.(); }} className="text-violet-600 hover:underline transition-colors">Sign In</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + features */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {features.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <FeatureCard feature={features[0]} delay="animate-delay-1200" />
              {features[1] && <div className="hidden xl:flex"><FeatureCard feature={features[1]} delay="animate-delay-1400" /></div>}
              {features[2] && <div className="hidden 2xl:flex"><FeatureCard feature={features[2]} delay="animate-delay-1600" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
