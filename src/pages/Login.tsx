import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignInPage, Feature } from '../components/ui/sign-in';
import { toast } from 'sonner';
import siteConfig from '../config/site-config.json';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Google sign-in coming soon!');
  };
  
  const handleResetPassword = () => {
    toast.info('Password reset feature coming soon!');
  };

  const handleCreateAccount = () => {
    navigate('/signup');
  };

  return (
    <SignInPage
      title={<span className="font-light text-gray-900 tracking-tighter">Welcome Back</span>}
      description="Sign in to your account and continue your journey with us"
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      features={siteConfig.features as Feature[]}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
}
