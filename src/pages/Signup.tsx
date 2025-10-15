import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignUpPage, Feature } from '../components/ui/sign-up';
import { toast } from 'sonner';
import siteConfig from '../config/site-config.json';

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const agreeTerms = formData.get('agreeTerms');

    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      toast.error('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(email, password);
      toast.success('Account created successfully! Welcome!');
      navigate('/');
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    toast.info('Google sign-up coming soon!');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <SignUpPage
      title={<span className="font-light text-gray-900 tracking-tighter">Join Us</span>}
      description="Create your account and start your journey with us"
      heroImageSrc="https://images.unsplash.com/photo-1551434678-e076c223a692?w=2160&q=80"
      features={siteConfig.features as Feature[]}
      onSignUp={handleSignUp}
      onGoogleSignUp={handleGoogleSignUp}
      onSignIn={handleSignIn}
    />
  );
}
