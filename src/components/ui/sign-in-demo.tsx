import { SignInPage, Feature } from "@/components/ui/sign-in";
import siteConfig from "../../config/site-config.json";

const SignInPageDemo = () => {
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);
    alert(`Sign In Submitted! Check the browser console for form data.`);
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    alert("Continue with Google clicked");
  };
  
  const handleResetPassword = () => {
    alert("Reset Password clicked");
  }

  const handleCreateAccount = () => {
    alert("Create Account clicked");
  }

  return (
    <SignInPage
      heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
      features={siteConfig.features as Feature[]}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
};

export default SignInPageDemo;
