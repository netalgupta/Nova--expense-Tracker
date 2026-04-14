"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const ORB_CONFIG = [
  { size: 300, color: "rgba(124,58,237,0.35)", x: "-10%", y: "-10%", duration: 8 },
  { size: 250, color: "rgba(255,107,107,0.2)", x: "70%", y: "5%", duration: 10 },
  { size: 200, color: "rgba(6,182,212,0.2)", x: "60%", y: "70%", duration: 7 },
  { size: 280, color: "rgba(124,58,237,0.2)", x: "5%", y: "65%", duration: 12 },
  { size: 180, color: "rgba(255,107,107,0.15)", x: "30%", y: "40%", duration: 9 },
  { size: 220, color: "rgba(6,182,212,0.15)", x: "85%", y: "35%", duration: 11 },
];

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error("Sign in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0A0E1A 0%, #0F1629 50%, #0A0E1A 100%)" }}>
      {/* Animated Orbs */}
      {ORB_CONFIG.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size, height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            left: orb.x, top: orb.y,
            filter: "blur(40px)",
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -40, 20, -15, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8 w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <motion.div
            className="relative inline-block mb-4"
            animate={{ filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span
              className="text-7xl font-black tracking-tighter"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #A855F7, #FF6B6B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Nova
            </span>
            {/* Glow */}
            <motion.div
              className="absolute inset-0 blur-2xl opacity-50 -z-10"
              style={{ background: "linear-gradient(135deg, #7C3AED, #FF6B6B)" }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-lg font-medium tracking-wide"
          >
            Your money. Understood.
          </motion.p>
        </motion.div>

        {/* Feature bullets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10 space-y-3 w-full"
        >
          {[
            { icon: "✨", text: "AI-powered spending insights" },
            { icon: "📊", text: "Smart budget predictions" },
            { icon: "🎯", text: "Goal tracking & badges" },
          ].map(({ icon, text }, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-slate-300 text-sm">{text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Google Sign In */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="w-full"
        >
          <motion.button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ boxShadow: "0 0 40px rgba(124,58,237,0.4)", scale: 1.02 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-6 text-xs text-slate-500 text-center"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Your data is encrypted and never shared.
        </motion.p>
      </div>
    </div>
  );
}
