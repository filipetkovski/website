import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signUpWithEmail, 
  loginWithEmail 
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const profile = await signInWithGoogle();
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        alert("Sign-in failed. Please ensure popups are allowed and try again.");
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const pass = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (authMode === 'signup') {
        const profile = await signUpWithEmail(name, email, pass);
        onSuccess(profile);
      } else {
        const profile = await loginWithEmail(email, pass);
        onSuccess(profile);
      }
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6 py-12 md:py-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-bg-base/95 backdrop-blur-md cursor-pointer"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm liquid-glass p-6 md:p-10 rounded-xl border-brand-primary/30 z-10 my-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-ink-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-brand-primary" />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold italic mb-1 md:mb-2 tracking-tight">
                {authMode === 'login' ? 'Welcome Back' : 'Join the Agency'}
              </h3>
              <p className="text-ink-muted text-xs md:text-sm font-light">
                {authMode === 'login' ? 'Enter credentials to continue.' : 'Create account to proceed.'}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">Full Name</label>
                  <input required name="name" type="text" className="w-full bg-white/5 border border-white/10 p-2.5 md:p-3 font-light focus:border-brand-primary outline-none transition-colors text-sm rounded-xl" placeholder="John Doe" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">Email</label>
                <input required name="email" type="email" className="w-full bg-white/5 border border-white/10 p-2.5 md:p-3 font-light focus:border-brand-primary outline-none transition-colors text-sm rounded-xl" placeholder="john@example.com" />
              </div>
              <div className="space-y-1 relative">
                <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">Password</label>
                <div className="relative">
                  <input required name="password" type={showPassword ? 'text' : 'password'} className="w-full bg-white/5 border border-white/10 p-2.5 md:p-3 font-light focus:border-brand-primary outline-none transition-colors text-sm pr-10 rounded-xl" placeholder="••••••••" />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button 
                disabled={isSubmitting}
                className="liquid-glass w-full py-3.5 md:py-4 text-white font-black uppercase tracking-widest hover:border-brand-primary/50 disabled:opacity-50 flex items-center justify-center gap-2 rounded-xl border-white/10 relative group cursor-pointer disabled:cursor-not-allowed"
              >
                <span className="relative z-10">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'login' ? 'Access' : 'Register')}</span>
              </button>
            </form>

            <div className="relative mb-6 md:mb-8 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <span className="relative z-10 bg-bg-surface px-4 text-[10px] text-ink-muted uppercase tracking-widest font-bold">Or continue with</span>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              className="liquid-glass w-full py-3.5 md:py-4 text-white font-bold uppercase tracking-widest hover:border-white/30 transition-all flex items-center justify-center gap-3 text-sm rounded-xl border-white/10 cursor-pointer"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
              Google
            </button>
            
            <div className="mt-6 md:mt-8 text-center">
              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-xs text-ink-muted hover:text-brand-primary font-bold uppercase tracking-widest border-b border-white/10 pb-1 cursor-pointer"
              >
                {authMode === 'login' ? "New here? Sign Up" : "Registered? Login"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
