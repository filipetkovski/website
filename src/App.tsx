/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Smartphone, 
  Search, 
  Globe, 
  CheckCircle, 
  Plus, 
  Minus, 
  ArrowRight, 
  Mail,
  Linkedin,
  Rocket,
  ShieldCheck,
  MousePointer2,
  Menu,
  X,
  Loader2,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Instagram,
  Mail as MailIcon,
  MessageCircle,
  ChevronDown,
  Eye,
  EyeOff,
  MapPin,
  Brain,
  Calendar,
  MessageSquare,
  BarChart3,
  Send,
  CloudCog,
  Star,
} from 'lucide-react';
import { 
  submitLead, 
  auth, 
  signInWithGoogle,
  signUpWithEmail,
  loginWithEmail, 
  getUserProfile, 
  UserProfile,
  getLeads,
  updateLeadStatus
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const logoSrc = '/favicon.png';

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

const CONTAINER_STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const ITEM_STAGGER = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const REVIEWS_VARIANTS = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export default function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringHero, setIsHoveringHero] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'OPEN_MOCKUP' | null>(null);
  const [isNavShrunk, setIsNavShrunk] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 0) {
        setIsNavShrunk(false);
        lastScrollY.current = 0;
        ticking.current = false;
        return;
      }

      // Shrink if scrolling down, grow if scrolling up
      // We use a small threshold (10px) to avoid jittering
      if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
        if (currentScrollY > lastScrollY.current) {
          setIsNavShrunk(true);
        } else {
          setIsNavShrunk(false);
        }
        lastScrollY.current = currentScrollY;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(handleScroll);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = isMobileMenuOpen || isModalOpen || isAuthModalOpen || isAdminPanelOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, isModalOpen, isAuthModalOpen, isAdminPanelOpen]);

  const [selectedPackage, setSelectedPackage] = useState<string>('visibility');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
        
        // Fulfill pending action if one exists
        if (pendingAction === 'OPEN_MOCKUP') {
          setIsModalOpen(true);
          setPendingAction(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [pendingAction]);

  const refreshLeads = async () => {
    if (user?.role === 'admin') {
      const data = await getLeads();
      setLeads(data);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' && isAdminPanelOpen) {
      refreshLeads();
    }
  }, [user, isAdminPanelOpen]);

  const handleOpenMockup = (packageId?: string) => {
    if (packageId) {
      setSelectedPackage(packageId);
    } else {
      setSelectedPackage('visibility');
    }

    if (!user) {
      setPendingAction('OPEN_MOCKUP');
      setAuthMode('signup');
      setIsAuthModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const profile = await signInWithGoogle();
      setUser(profile);
      setIsAuthModalOpen(false);
      setIsMobileMenuOpen(false);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      // Only alert if it's not a user-cancellation
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        alert("Sign-in failed. Please ensure popups are allowed and try again. Error: " + (err?.message || "Unknown error"));
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
        setUser(profile);
      } else {
        const profile = await loginWithEmail(email, pass);
        setUser(profile);
      }
      setIsAuthModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLeadStatus = async (leadId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await updateLeadStatus(leadId, newStatus);
      refreshLeads();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const reviews = [
    {
      client: "Boardwalk Fries",
      quote: "Top-tier developer. Consult Prompts built an optimized site that loads instantly and works perfectly on all devices. Hit every deadline and exceeded expectations.",
      image: "boardwalk.png",
      business: "FAST FOOD RESTAURANT"
    },
    {
      client: "Inspire",
      quote: "Best $299 I ever spent. The mobile performance is better than my previous $3k site. Highly recommended.",
      image: "inspire.png",
      business: "BARBER SHOP"
    },
    {
      client: "Zen Coffee",
      quote: "Professional, fast, and converts like crazy. Filip knows exactly what a local business needs to stand out.",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600",
      business: "Specialty Coffee"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePanel((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Delivery Time", value: "72 Hours" },
    { label: "Visibility", value: "SEO" },
    { label: "Experience", value: "5+ Years" },
  ];

  const processSteps = [
    {
      id: "01",
      title: "Get your Mockup",
      description: "We design a high-fidelity visual of your site based on your brand. No guesswork, just results.",
      icon: <MousePointer2 className="w-6 h-6 text-brand-primary" />
    },
    {
      id: "02",
      title: "Approve & Launch",
      description: "Once you love the design, we build and deploy. Your site goes live on a world-class infrastructure.",
      icon: <Rocket className="w-6 h-6 text-brand-primary" />
    },
    {
      id: "03",
      title: "Get more Sales",
      description: "Stop losing customers to slow loading times or bad UX. Convert visitors into loyal clients immediately.",
      icon: <CheckCircle className="w-6 h-6 text-brand-primary" />
    }
  ];

  const faqs = [
    {
      question: "Why is it so cheap?",
      answer: "Traditional agencies are slow and bloated. We use AI-assisted design workflows and specialized engineering to strip out the waste. You get high-end results without paying for an agency's fancy office."
    },
    {
      question: "How fast is it?",
      answer: "We aim for a 72-hour turnaround from the moment we have your core business info. Speed is our competitive advantage."
    },
    {
      question: "What if I need more than 5 pages?",
      answer: "Our core offer is optimized for efficiency. If you need a more complex site, we can discuss a custom quote, but 99% of local businesses shine with our 3-5 page high-performance setup."
    },
    {
      question: "Do you offer maintenance?",
      answer: "Yes. For a small monthly fee, we handle all updates, security, and hosting, so you can focus on running your business."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden selection:bg-brand-primary selection:text-bg-base font-sans">
      {/* SEO Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebAgency",
          "name": "ConsultPrompts",
          "description": "High-performance web design for local businesses. $299 flat fee, 72-hour delivery.",
          "url": window.location.origin,
          "image": `${window.location.origin}/favicon.png`,
          "priceRange": "$299",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "Global"
          },
          "offers": {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Local Business Web Design",
              "description": "High-performance, mobile-optimized website for local businesses."
            }
          }
        })}
      </script>

      {/* Mockup Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6 py-12 md:py-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                setSubmitted(false);
              }}
              className="fixed inset-0 bg-bg-base/90 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg liquid-glass p-8 md:p-12 rounded-xl brutalist-border z-10 my-auto"
            >
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSubmitted(false);
                }}
                className="absolute top-6 right-6 text-ink-muted hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {!submitted ? (
                <>
                  <div className="mb-8">
                    <h3 className="font-display text-3xl font-bold italic mb-2">Claim Your Spot</h3>
                    <p className="text-ink-muted text-sm font-light">Tell us about your business. We'll build the vision for free.</p>
                  </div>

                  <form 
                    className="space-y-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmitting(true);
                      const formData = new FormData(e.currentTarget);
                      try {
                        await submitLead({
                          name: formData.get('name') as string,
                          email: formData.get('email') as string,
                          business: formData.get('business') as string,
                          message: formData.get('message') as string,
                          package: formData.get('package') as string,
                          userId: user?.uid || '',
                        });
                        setSubmitted(true);
                      } catch (err) {
                        alert("Something went wrong. Please try again.");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block">Company Name</label>
                      <input required defaultValue={user?.displayName || ''} name="name" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-light focus:border-brand-primary outline-none transition-colors rounded-xl" placeholder="Agency Name / Business LLC" />
                    </div>
                    <div className="space-y-2 hidden">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block">Work Email</label>
                      <input required defaultValue={user?.email || ''} name="email" type="email" className="w-full bg-white/5 border border-white/10 p-4 font-light focus:border-brand-primary outline-none transition-colors rounded-xl" placeholder="filip@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block">Business Type</label>
                      <input required name="business" type="text" className="w-full bg-white/5 border border-white/10 p-4 font-light focus:border-brand-primary outline-none transition-colors rounded-xl" placeholder="Nail Salon / Local Service" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block">Select Your Package</label>
                      <div className="relative">
                        <select 
                          required 
                          name="package" 
                          value={selectedPackage} 
                          onChange={(e) => setSelectedPackage(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 p-4 font-light focus:border-brand-primary outline-none transition-colors appearance-none cursor-pointer pr-12 rounded-xl"
                        >
                          <option value="facelift" className="bg-bg-surface">Digital Face-Lift ($299)</option>
                          <option value="visibility" className="bg-bg-surface">Visibility Booster ($499)</option>
                          <option value="growth" className="bg-bg-surface">Auto-Pilot Growth ($699)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block">Message (Optional)</label>
                      <textarea name="message" className="w-full bg-white/5 border border-white/10 p-4 font-light focus:border-brand-primary outline-none transition-colors h-24 resize-none rounded-xl" placeholder="Give us a head start..."></textarea>
                    </div>
                    <button 
                      disabled={isSubmitting}
                      className="liquid-glass w-full py-4 text-white font-black uppercase tracking-widest hover:border-brand-primary transition-all flex items-center justify-center gap-2 rounded-xl border-white/10 relative group cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit"}</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-brand-primary" />
                  </div>
                  <h3 className="font-display text-3xl font-bold italic mb-4">Transmission Received</h3>
                  <p className="text-ink-muted leading-relaxed font-light mb-8">We're already analyzing your business DNA. Expect your mockup within 24-48 hours.</p>
                  
                  <div className="flex flex-col gap-4 items-center">
                    <a 
                      href="https://wa.me/13026622736" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-4 bg-green-500 text-bg-base font-black uppercase tracking-widest hover:bg-green-400 transition-colors flex items-center justify-center gap-2 rounded-lg cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Chat on WhatsApp
                    </a>

                    <button 
                      onClick={() => {
                        setIsModalOpen(false);
                        setSubmitted(false);
                      }}
                      className="text-xs font-bold uppercase tracking-widest border-b border-brand-primary pb-1 hover:text-brand-primary hover:border-white transition-colors cursor-pointer"
                    >
                      Back Home
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[110] overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6 py-12 md:py-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="fixed inset-0 bg-bg-base/95 backdrop-blur-md cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm liquid-glass p-6 md:p-10 rounded-xl border-brand-primary/30 z-10 my-auto"
            >
              <div className="text-center mb-6 md:mb-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-brand-primary" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold italic mb-1 md:mb-2 tracking-tight">
                  {authMode === 'login' ? 'Welcome Back' : 'Join the Agency'}
                </h3>
                <p className="text-ink-muted text-xs md:text-sm font-light">
                  {authMode === 'login' ? 'Enter credentials to continue.' : 'Create account to request mockup.'}
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-white cursor-pointer"
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

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminPanelOpen && user?.role === 'admin' && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-base"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl h-full md:h-[90vh] bg-bg-surface border border-white/5 md:rounded-sm overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between bg-bg-base flex-shrink-0 gap-6">
                <div>
                  <h2 className="font-display text-2xl font-bold italic flex items-center gap-3">
                    <LayoutDashboard className="w-6 h-6 text-brand-primary" />
                    Admin Command
                  </h2>
                  <p className="text-ink-muted text-xs uppercase tracking-widest mt-1">Mockup Requests / Pipeline</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-sm border border-white/10">
                  {(['all', 'pending', 'completed'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setAdminFilter(f)}
                      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        adminFilter === f 
                          ? 'bg-brand-primary text-bg-base' 
                          : 'text-ink-muted hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="absolute top-6 right-6 md:static z-[60] p-2 bg-bg-surface md:bg-transparent border border-white/10 md:border-none rounded-full hover:text-brand-primary transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-bg-base">
                <div className="grid gap-6">
                  {leads.filter(l => adminFilter === 'all' || (l.status || 'pending') === adminFilter).length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-white/10 italic text-ink-muted">
                      No matching communications detected in the stream.
                    </div>
                  ) : (
                    leads
                      .filter(l => adminFilter === 'all' || (l.status || 'pending') === adminFilter)
                      .map((lead) => (
                      <div key={lead.id} className="p-6 bg-white/[0.02] border border-white/5 hover:border-brand-primary/30 transition-colors group">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-lg text-white">{lead.name}</h4>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${lead.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {lead.status || 'pending'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-brand-primary text-sm font-medium">{lead.business}</p>
                              {lead.package && (
                                <span className="text-[8px] uppercase tracking-widest font-black bg-white/10 px-1.5 py-0.5 rounded text-white italic">
                                  {lead.package}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm">{lead.email}</p>
                            <p className="text-[10px] text-ink-muted uppercase tracking-widest mt-1">
                              {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {lead.message && (
                          <div className="p-4 bg-bg-base rounded-sm border border-white/5 text-sm text-ink-muted font-light whitespace-pre-wrap mb-4">
                            {lead.message}
                          </div>
                        )}
                        <div className="flex justify-end pt-4 border-t border-white/5">
                          <button 
                            onClick={() => toggleLeadStatus(lead.id, lead.status || 'pending')}
                            className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-brand-primary hover:text-bg-base transition-all rounded-sm cursor-pointer"
                          >
                            Mark as {lead.status === 'completed' ? 'Pending' : 'Completed'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Profile Menu Overlay */}
      <AnimatePresence>
        {isProfileOpen && user && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 z-[155] bg-transparent cursor-pointer"
            />
            <div className="fixed inset-0 z-[160] flex items-end justify-center p-6 md:items-start md:justify-end md:p-24 overflow-hidden pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-sm liquid-glass border-brand-primary/20 pointer-events-auto shadow-2xl p-8 rounded-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-bg-base font-black text-xl">
                    {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display font-bold italic">{user.displayName || 'Prophet'}</h4>
                    <p className="text-xs text-ink-muted tracking-widest uppercase">{user.role}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => { setIsAdminPanelOpen(true); setIsProfileOpen(false); }}
                      className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-brand-primary hover:text-bg-base transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Admin Console
                    </button>
                  )}
                  <button 
                    onClick={() => { auth.signOut(); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Log Out Signal
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-bg-base/80 backdrop-blur-md transition-all duration-300 py-3 md:py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
              <img 
                src={logoSrc} 
                alt="ConsultPrompts Logo" 
                className="w-full h-full object-contain border-none bg-transparent"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-bg-base w-5 h-5 fill-current"><path d="m5 14 7-3 7 3V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v9Z"/><path d="M7 18h10"/><path d="M10 22h4"/></svg>';
                  }
                }}
              />
            </div>
            <span className="font-display font-bold tracking-tight uppercase text-xl">Consult Prompts</span>
          </div>
          
          <div className="hidden xl:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-ink-muted opacity-100">
            <a href="#process" className="hover:text-brand-primary transition-colors cursor-pointer">Process</a>
            <a href="#pricing" className="hover:text-brand-primary transition-colors cursor-pointer">Pricing</a>
            <a href="#reviews" className="hover:text-brand-primary transition-colors cursor-pointer">RESULTS</a>
            <a href="#faq" className="hover:text-brand-primary transition-colors cursor-pointer">FAQ</a>
            <a href="#contact" className="hover:text-brand-primary transition-colors cursor-pointer">Contact</a>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className="flex items-center gap-2 text-brand-primary hover:text-white transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </button>
            )}
          </div>

            <div className="hidden xl:flex items-center gap-4">
              <button 
                onClick={handleOpenMockup}
                className="liquid-glass text-sm font-bold uppercase tracking-widest text-white px-5 py-2.5 rounded-xl hover:border-brand-primary/50 transition-all border-white/10 cursor-pointer"
              >
                START YOUR PROJECT
              </button>
              {!user ? (
                <button 
                  onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                  className="text-xs font-bold uppercase tracking-widest px-4 py-2 hover:text-brand-primary transition-colors cursor-pointer"
                >
                  Sign up
                </button>
              ) : (
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="relative group p-1 rounded-full border-2 border-white/10 hover:border-brand-primary transition-all overflow-hidden cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-white font-bold group-hover:text-brand-primary">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  {isProfileOpen && <div className="absolute inset-0 bg-brand-primary/10" />}
                </button>
              )}
            </div>

          {/* Hamburger */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="xl:hidden p-2 text-white cursor-pointer"
          >
            <Menu className="w-8 h-8" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-bg-base p-8 flex flex-col overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12 flex-shrink-0">
              <div className="flex items-center gap-2">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
              <img 
                src={logoSrc} 
                alt="ConsultPrompts Logo" 
                className="w-full h-full object-contain border-none bg-transparent"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-bg-base w-5 h-5 fill-current"><path d="m5 14 7-3 7 3V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v9Z"/><path d="M7 18h10"/><path d="M10 22h4"/></svg>';
                  }
                }}
              />
            </div>
                <span className="font-display font-bold uppercase text-xl">Consult Prompts</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="cursor-pointer">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex flex-col gap-8 text-2xl font-display font-bold italic">
              <a href="#process" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-primary cursor-pointer">Process</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-primary cursor-pointer">Pricing</a>
              <a href="#reviews" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-primary cursor-pointer">Results</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-primary cursor-pointer">Faq</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-primary cursor-pointer">Contact</a>
              {user?.role === 'admin' && (
                <button onClick={() => { setIsAdminPanelOpen(true); setIsMobileMenuOpen(false); }} className="text-left text-brand-primary uppercase cursor-pointer">ADMIN PANEL</button>
              )}
            </div>

            <div className="mt-auto space-y-6">
              {user ? (
                <div className="flex flex-col gap-6">
                  <button 
                    onClick={() => { handleOpenMockup(); setIsMobileMenuOpen(false); }}
                    className="liquid-glass w-full py-5 text-white font-black uppercase tracking-widest rounded-xl border-brand-primary/20 relative group cursor-pointer"
                  >
                    <span className="relative z-10">START YOUR PROJECT</span>
                  </button>
                  <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-ink-muted text-center uppercase tracking-widest">{user.email}</p>
                    <button 
                      onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }}
                      className="liquid-glass w-full py-4 text-white font-bold uppercase tracking-widest rounded-xl border-white/10 cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }}
                    className="liquid-glass w-full py-4 text-white font-bold uppercase tracking-widest rounded-xl border-white/10 cursor-pointer"
                  >
                    Sign up
                  </button>
                  <button 
                    onClick={() => { handleOpenMockup(); setIsMobileMenuOpen(false); }}
                    className="liquid-glass w-full py-5 text-white font-black uppercase tracking-widest rounded-xl border-brand-primary/20 relative group cursor-pointer"
                  >
                    <span className="relative z-10">START YOUR PROJECT</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <header 
        id="hero" 
        onMouseEnter={() => setIsHoveringHero(true)}
        onMouseLeave={() => setIsHoveringHero(false)}
        className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center"
      >
        {/* Modern Background Visualizations */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main Animated Orb */}
          <motion.div 
            animate={{
              x: mousePosition.x * 0.05,
              y: mousePosition.y * 0.05,
            }}
            className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50" 
          />
          <motion.div 
            animate={{
              x: mousePosition.x * -0.03,
              y: mousePosition.y * -0.03,
            }}
            className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px] mix-blend-screen opacity-30" 
          />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          
          {/* Floating Elements */}
          <AnimatePresence>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.2, 1],
                  x: Math.sin(i) * 20,
                  y: Math.cos(i) * 20
                }}
                transition={{ 
                  duration: 4 + i, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute text-brand-primary/20"
                style={{
                  top: `${20 + (i * 12)}%`,
                  left: `${15 + (i * 15)}%`,
                }}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div 
              className="lg:col-span-7"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  Precision Engineering for Local Brands
                </span>
              </div>
              
              <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tighter mb-8">
                Websites that <br/>
                <span className="text-brand-primary italic">actually</span> build <br/>
                your empire.
              </h1>
              
              <p className="text-lg md:text-xl text-ink-muted max-w-xl mb-12 leading-relaxed font-light">
                Why pay $5k for mediocrity? We build <span className="text-white font-medium">high-velocity, high-conversion digital experiences</span> with AI-powered efficiency. <span className="italic">Ready in 72 hours.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={() => handleOpenMockup()}
                  className="liquid-glass group relative px-10 py-5 text-white font-bold text-lg uppercase tracking-widest rounded-xl overflow-hidden transition-all hover:scale-[1.05] active:scale-[0.98] w-full sm:w-auto text-center border-brand-primary/40 hover:border-brand-primary/80 cursor-pointer"
                >
                  <span className="relative z-10">START YOUR PROJECT</span>
                </button>
                <div className="flex -space-x-3 items-center">
                   {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-bg-base bg-bg-surface overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                     </div>
                   ))}
                   <div className="pl-6">
                     <div className="flex gap-1 mb-1">
                       {[...Array(5)].map((_, i) => (
                         <Zap key={i} className="w-3 h-3 text-brand-primary fill-current" />
                       ))}
                     </div>
                     <p className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">30+ Sites Shipped</p>
                   </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-5 hidden lg:block"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative group">
                {/* Decoration */}
                <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/50 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                
                <div className="relative liquid-glass p-2 rounded-2xl border-white/10 shadow-3xl transform group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="overflow-hidden rounded-xl bg-bg-base">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={activePanel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="aspect-[4/5] relative"
                      >
                        <img 
                          src={reviews[activePanel].image} 
                          className="absolute inset-0 w-full h-full object-cover opacity-60" 
                          alt={reviews[activePanel].client}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-bg-base via-bg-base/20 to-transparent" />
                        
                        <div className="absolute inset-x-0 bottom-0 p-8 pt-20">
                          <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <Zap key={i} className="w-4 h-4 text-brand-primary fill-current" />
                            ))}
                          </div>
                          <p className="text-2xl font-display font-bold italic text-white mb-6 leading-tight">
                            "{reviews[activePanel].quote}"
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-1 bg-brand-primary rounded-full"></div>
                            <div>
                                <span className="block font-bold text-white tracking-wide uppercase text-sm">{reviews[activePanel].client}</span>
                                <span className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em]">{reviews[activePanel].business}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  {/* Indicators */}
                  <div className="absolute top-6 right-6 flex flex-col gap-2">
                    {reviews.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setActivePanel(i)}
                        className={`w-1 transition-all duration-300 cursor-pointer ${activePanel === i ? 'h-8 bg-brand-primary' : 'h-4 bg-white/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Floating "AI Quality" Tag */}
                <motion.div 
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-6 -right-6 liquid-glass px-6 py-4 rounded-xl border-brand-primary/30 text-white font-display font-black text-xs tracking-[0.3em] uppercase neon-glow z-20 backdrop-blur-xl"
                >
                  AI ENHANCED
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

      </header>

      {/* Stats Moving Ticker Row */}
      <div className="relative py-10 md:py-16 border-y border-white/5 bg-bg-base/50 backdrop-blur-sm z-20">
         <div className="max-w-7xl mx-auto px-6 overflow-hidden">
            <motion.div 
              animate={{ x: [0, -2000] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="flex whitespace-nowrap gap-4 md:gap-10"
            >
                {[...Array(12)].map((_, i) => (
                  <span key={i} className="text-xs md:text-2xl uppercase tracking-widest font-black text-white flex items-center gap-4 md:gap-10">
                    <Zap className="w-5 h-5 md:w-8 md:h-8 text-brand-primary fill-current" />
                    72-HOUR DELIVERY
                    <Zap className="w-5 h-5 md:w-8 md:h-8 text-brand-primary fill-current" />
                    GLOBAL SEO BOOST
                    <Zap className="w-5 h-5 md:w-8 md:h-8 text-brand-primary fill-current" />
                    5+ YEARS EXPERIENCE
                  </span>
                ))}
            </motion.div>
         </div>
      </div>

      {/* Remove redundant static stats strip */}

      {/* Process Section */}
      <section id="process" aria-label="Our Web Design Process" className="py-16 md:py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div {...FADE_UP} className="mb-12 md:mb-20 text-center md:text-left relative">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest block mb-4">Our DNA</span>
            <h2 className="font-display text-3xl md:text-6xl font-bold mb-6 italic">Simple. Brutal. Fast Web Design.</h2>
            <p className="text-ink-muted text-base md:text-lg max-w-2xl font-light">We've automated the fluff out of local business web design. Here's how we get your new site live in record time.</p>
          </motion.div>

          {/* Slide Indicator for Mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 opacity-60">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-primary italic">Slide</span>
            <div className="h-[1.5px] w-12 bg-brand-primary" />
          </div>

          <motion.div 
            variants={CONTAINER_STAGGER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="flex md:flex-row overflow-x-auto lg:grid lg:grid-cols-3 gap-8 md:gap-12 pb-8 lg:pb-0 snap-x snap-mandatory brutalist-scrollbar scroll-smooth"
          >
            {processSteps.map((step) => (
              <motion.div 
                key={step.id} 
                variants={ITEM_STAGGER}
                className="liquid-glass group p-8 brutalist-border relative overflow-hidden flex-shrink-0 w-[calc(100vw-3rem)] md:w-[calc(50vw-3rem)] lg:w-auto snap-start transition-all duration-300 rounded-xl"
              >
                <div className="absolute top-0 right-0 font-display text-8xl font-black text-white/[0.03] -translate-y-4 translate-x-1 group-hover:text-brand-primary/5 transition-colors">
                  {step.id}
                </div>
                <div className="mb-6">{step.icon}</div>
                <h3 className="font-display text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-ink-muted leading-relaxed text-sm font-light">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services & Pricing */}
      <section id="pricing" aria-label="Pricing and Web Design Services" className="py-16 md:py-24 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.div {...FADE_UP} className="mb-16 text-center lg:text-left">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest mb-4 block">Scalable Growth Tiers</span>
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-8 italic leading-tight">Pick Your Fuel.</h2>
          </motion.div>

          <motion.div 
            variants={CONTAINER_STAGGER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Package 1: Digital Face-Lift */}
            <motion.div 
              variants={ITEM_STAGGER}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="liquid-glass p-8 rounded-xl border-white/10 flex flex-col relative group"
            >
              <div className="absolute inset-0 border border-transparent group-hover:border-brand-primary/30 transition-colors duration-300 rounded-xl pointer-events-none" />
              <div className="mb-8">
                <h3 className="font-display text-2xl font-bold italic mb-2">Digital Face-Lift</h3>
                <p className="text-ink-muted text-sm font-light">The ultimate hook. High-speed, modern replacement for old sites.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display font-black leading-none">$299</span>
                  <span className="text-xs text-ink-muted font-bold tracking-widest uppercase">/ Startup</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1 border-t border-white/5 pt-8">
                <li className="flex gap-3 text-sm">
                  <Smartphone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>3-5 Modern Pages (Mobile-First)</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Zap className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Speed Optimization</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <CloudCog className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Domain & Hosting Transfer</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Search className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Basic Global SEO</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <MessageCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Lead Capture Form</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Rocket className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>48–72 Hour Turnaround</span>
                </li>
              </ul>
              <button 
                onClick={() => handleOpenMockup('facelift')}
                className="liquid-glass w-full py-4 text-white font-bold uppercase tracking-widest hover:border-brand-primary/50 transition-all rounded-xl cursor-pointer"
              >
                Select Package
              </button>
            </motion.div>

            {/* Package 2: Visibility Booster */}
            <motion.div 
              variants={ITEM_STAGGER}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="liquid-glass p-8 rounded-xl border-brand-primary/30 relative flex flex-col neon-glow-subtle bg-linear-to-br from-white/10 to-white/5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-brand-primary text-bg-base text-[10px] font-black px-4 py-1 uppercase tracking-widest">Best Value</div>
              <div className="mb-8">
                <h3 className="font-display text-2xl font-bold italic mb-2">Visibility Booster</h3>
                <p className="text-ink-muted text-sm font-light">The better deal. Not just a site, but a way to get found on Google.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display font-black leading-none">$499</span>
                  <span className="text-xs text-ink-muted font-bold tracking-widest uppercase">/ Performance</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1 border-t border-white/10 pt-8">
                <li className="font-bold text-xs uppercase tracking-widest text-brand-primary mb-2 italic">Everything in $299 Plus:</li>
                <li className="flex gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Google Business Profile (GBP) Fix</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Search className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Local SEO (City/Neighborhood)</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Instagram className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Social Feed Auto-Sync</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Brain className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>AI Persuasive Copywriting</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Zap className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>1 Month "On-Call" Updates</span>
                </li>
              </ul>
              <button 
                onClick={() => handleOpenMockup('visibility')}
                className="liquid-glass w-full py-4 text-white font-bold uppercase tracking-widest hover:border-brand-primary transition-all rounded-xl cursor-pointer"
              >
                Go Visibility
              </button>
            </motion.div>

            {/* Package 3: Auto-Pilot Growth */}
            <motion.div 
              variants={ITEM_STAGGER}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="liquid-glass p-8 rounded-xl border-white/10 flex flex-col relative group"
            >
              <div className="absolute inset-0 border border-transparent group-hover:border-brand-primary/30 transition-colors duration-300 rounded-xl pointer-events-none" />
              <div className="mb-8">
                <h3 className="font-display text-2xl font-bold italic mb-2">Auto-Pilot Growth</h3>
                <p className="text-ink-muted text-sm font-light">The premium. Saving the owner 5+ hours a week in admin work.</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-display font-black leading-none">$699</span>
                  <span className="text-xs text-ink-muted font-bold tracking-widest uppercase">/ Enterprise</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1 border-t border-white/5 pt-8">
                <li className="font-bold text-xs uppercase tracking-widest text-brand-primary mb-2 italic">Everything in $499 Plus:</li>
                <li className="flex gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Integrated Booking System</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <MessageSquare className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>24/7 AI Chatbot Assistant</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <BarChart3 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Premium Analytics Dashboard</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Send className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>Email/SMS Automation</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <ShieldCheck className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span>3 Months Priority Support</span>
                </li>
              </ul>
              <button 
                onClick={() => handleOpenMockup('growth')}
                className="liquid-glass w-full py-4 text-white font-bold uppercase tracking-widest hover:border-brand-primary/50 transition-all rounded-xl cursor-pointer"
              >
                Go Premium
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" aria-label="Client Results and Success Stories" className="py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div {...FADE_UP} className="mb-12 md:mb-16 text-center lg:text-left">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest block mb-4">Proven Web Performance</span>
            <h2 className="font-display text-3xl md:text-6xl font-bold mb-6 italic">Real World Business RESULTS.</h2>
            <p className="text-ink-muted text-base md:text-lg max-w-2xl font-light">We don't just build sites; we build business success stories. Here's what our clients say after going live.</p>
          </motion.div>

          {/* Slide Indicator for Mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 opacity-60">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-brand-primary italic">Slide</span>
            <div className="h-[1.5px] w-12 bg-brand-primary" />
          </div>

          <div className="flex md:flex-row overflow-x-auto lg:grid lg:grid-cols-3 gap-8 pb-8 lg:pb-0 snap-x snap-mandatory brutalist-scrollbar scroll-smooth">
            {reviews.map((review, i) => (
              <motion.div 
                key={review.client}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={REVIEWS_VARIANTS}
                className="liquid-glass flex flex-col group overflow-hidden flex-shrink-0 w-[calc(100vw-3rem)] md:w-[calc(50vw-3rem)] lg:w-auto snap-start rounded-xl relative"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={review.image} 
                    alt={review.client}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-bg-base via-bg-base/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute top-4 left-4 liquid-glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-primary border-brand-primary/30">
                    {review.business}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col relative">
                  {/* Decorative quote mark */}
                  <div className="absolute top-4 right-8 text-6xl font-display text-white/5 pointer-events-none select-none">"</div>
                  
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-brand-primary fill-current" />
                    ))}
                  </div>

                  <p className="text-white text-base leading-relaxed italic mb-8 flex-1 relative z-10">"{review.quote}"</p>
                  
                  <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                       {review.client.charAt(0)}
                    </div>
                    <div>
                      <span className="font-display font-bold text-white block leading-tight">{review.client}</span>
                      <span className="text-[10px] text-brand-primary uppercase tracking-widest font-black">Satisfied Client</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" aria-label="Frequently Asked Questions" className="py-24 px-6 relative border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.div {...FADE_UP} className="mb-16 text-center">
            <h2 className="font-display text-3xl md:text-6xl font-bold italic">Web Design FAQ.</h2>
            <p className="text-ink-muted mt-4 font-light">Everything you need to know about our high-speed development process.</p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i} 
                className="liquid-glass border border-white/10 rounded-xl overflow-hidden mb-4 last:mb-0 transition-all duration-300"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span className="font-bold tracking-wide italic">{faq.question}</span>
                  {openFaq === i ? <Minus className="w-4 h-4 text-brand-primary" /> : <Plus className="w-4 h-4 text-brand-primary" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6"
                    >
                      <p className="text-ink-muted text-sm leading-relaxed font-light">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <motion.div {...FADE_UP} className="max-w-xl">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest mb-4 block">Direct Comms</span>
            <h2 className="font-display text-3xl md:text-6xl font-bold mb-6 italic">No gatekeepers. <br /> Just results.</h2>
            <p className="text-ink-muted font-light leading-relaxed">Have a question about a specific integration or a custom bulk deal? Reach out to the source.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <a href="mailto:consultprompts@gmail.com" className="flex items-center gap-4 p-6 liquid-glass brutalist-border rounded-xl group min-w-0 transition-all duration-300 cursor-pointer">
              <div className="p-3 rounded bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-bg-base transition-colors shrink-0">
                <MailIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted block mb-1">Email Strategy</span>
                <span className="text-sm md:text-base lg:text-lg font-display font-bold break-words block leading-tight">consultprompts@gmail.com</span>
              </div>
            </a>
            <a href="https://instagram.com/consultprompts" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-6 liquid-glass brutalist-border rounded-xl group min-w-0 transition-all duration-300 cursor-pointer">
              <div className="p-3 rounded bg-brand-secondary/10 text-brand-secondary group-hover:bg-brand-secondary group-hover:text-bg-base transition-colors shrink-0">
                <Instagram className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted block mb-1">Visual Log</span>
                <span className="text-sm md:text-base lg:text-lg font-display font-bold truncate block">@consultprompts</span>
              </div>
            </a>
            <a href="https://wa.me/13026622736" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-6 liquid-glass brutalist-border rounded-xl group min-w-0 transition-all duration-300 cursor-pointer">
              <div className="p-3 rounded bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-bg-base transition-colors shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted block mb-1">WhatsApp Chat</span>
                <span className="text-sm md:text-base lg:text-lg font-display font-bold truncate block">+1 (302) 662 2736</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-6 text-center bg-brand-primary selection:bg-bg-base selection:text-white">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...FADE_UP} className="font-display text-3xl sm:text-5xl md:text-8xl font-black text-bg-base tracking-tighter italic leading-[0.9] mb-12">
            READY TO <br /> DISRUPT THE NEIGHBORHOOD?
          </motion.h2>
          <motion.div {...FADE_UP} transition={{ delay: 0.2 }}>
            <button 
              onClick={handleOpenMockup}
              className="liquid-glass px-8 md:px-12 py-4 md:py-5 text-white font-black text-xl md:text-2xl uppercase tracking-widest hover:scale-105 transition-transform rounded-xl border border-brand-primary/50 shadow-[0_0_20px_rgba(var(--color-brand-primary),0.2)] cursor-pointer"
            >
              Claim Your Spot
            </button>
            <p className="mt-8 text-bg-base/70 font-bold text-sm tracking-widest uppercase">

            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-8 text-center xl:text-left">
          <div className="flex flex-col gap-2 items-center xl:items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                <img 
                  src={logoSrc} 
                  alt="ConsultPrompts Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-bg-base w-3 h-3 fill-current"><path d="m5 14 7-3 7 3V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v9Z"/><path d="M7 18h10"/><path d="M10 22h4"/></svg>';
                    }
                  }}
                />
              </div>
              <span className="font-display font-bold uppercase tracking-tight">Consult Prompts</span>
            </div>
            <span className="text-ink-muted text-xs font-medium uppercase tracking-[0.2em]">Designed by Filip Petkovski</span>
          </div>
          
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-ink-muted">
            <a href="mailto:consultprompts@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <Mail className="w-4 h-4" />
              Email
            </a>
            <a href="https://wa.me/13026622736" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a href="https://instagram.com/consultprompts" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <Instagram className="w-4 h-4" />
              Instagram
            </a>
          </div>
          
          <div className="text-[10px] text-ink-muted/50 uppercase tracking-[0.3em]">
            © 2026 CONSULT PROMPTS. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
