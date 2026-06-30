import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  User
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  ShieldAlert, Sparkles, LogIn, UserPlus, Mail, Lock, 
  ChevronRight, Smartphone, Info, KeyRound, CheckCircle2, AlertCircle, HelpCircle
} from "lucide-react";

interface AuthProps {
  onAuthSuccess: (user: User, wasNewUser: boolean) => void;
  addSystemLog: (text: string, type?: "info" | "warning" | "success" | "error") => void;
}

export default function Auth({ onAuthSuccess, addSystemLog }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    if (!email || !password) {
      setErrorMsg("Please fill in all email and password credentials.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg("Confirmation password does not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign Up
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        addSystemLog(`User account successfully registered: ${email}`, "success");
        setSuccessMsg("Account registered successfully! Logging you in...");
        setTimeout(() => {
          onAuthSuccess(credential.user, true);
        }, 1200);
      } else {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        addSystemLog(`User successfully authenticated with email: ${email}`, "success");
        onAuthSuccess(credential.user, false);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let localizedError = err.message;
      if (err.code === "auth/email-already-in-use") {
        localizedError = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        localizedError = "Invalid email or password combination.";
      } else if (err.code === "auth/operation-not-allowed") {
        localizedError = "Email/Password sign-in is not enabled in your Firebase console yet.";
        setShowFirebaseGuide(true);
      }
      setErrorMsg(localizedError);
      addSystemLog(`Authentication failed: ${localizedError}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      addSystemLog(`User successfully authenticated via Google: ${result.user.email}`, "success");
      onAuthSuccess(result.user, false);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let localizedError = err.message;
      if (err.code === "auth/popup-closed-by-user") {
        localizedError = "Google login pop-up was closed before completion.";
      } else if (err.code === "auth/operation-not-allowed") {
        localizedError = "Google Authentication is not enabled in your Firebase console.";
        setShowFirebaseGuide(true);
      }
      setErrorMsg(localizedError);
      addSystemLog(`Google Sign-In failed: ${localizedError}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-neutral-950 h-full" id="auth-screen">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden" id="auth-container-card">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
            <Sparkles className="w-6 h-6 text-rose-500 animate-pulse" />
          </div>
          <h1 className="text-lg font-black tracking-widest uppercase text-white font-mono flex items-center justify-center gap-1.5">
            RESCUE
            <span className="text-[9px] bg-rose-600 px-1.5 py-0.5 rounded-full text-white font-bold tracking-normal font-sans">
              CLOUD
            </span>
          </h1>
          <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-sans">
            Connect your workspace to cloud-hosted databases & user synchronization.
          </p>
        </div>

        {/* Dynamic Forms */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition font-mono"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition font-mono"
                  required
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-1.5 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] text-rose-400 font-sans leading-snug">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-1.5 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 font-sans leading-snug">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/15 disabled:opacity-50 font-mono"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Register Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Secure Login
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-neutral-800"></div>
          <span className="px-2.5 text-[9px] font-mono text-neutral-500 uppercase">Or Continue With</span>
          <div className="flex-1 h-px bg-neutral-800"></div>
        </div>

        {/* Google sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 font-mono disabled:opacity-50"
        >
          {/* Flat stylized Google logo */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113A5.72 5.72 0 0 1 8.24 12.8a5.72 5.72 0 0 1 5.751-5.713c1.554 0 2.956.592 4.022 1.55l3.245-3.243A10.15 10.15 0 0 0 13.992 2.37c-5.717 0-10.12 4.673-10.12 10.43 0 5.757 4.403 10.43 10.12 10.43 5.437 0 9.882-3.877 9.882-9.565 0-.585-.054-1.25-.154-1.78l-9.62.001z"
            />
          </svg>
          Sign In with Google
        </button>

        {/* Account state toggler */}
        <div className="text-center mt-5">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-[10px] font-mono text-neutral-400 hover:text-white underline transition cursor-pointer"
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Create one"}
          </button>
        </div>

        {/* Admin Setup Assistance guide toggle */}
        <div className="mt-4 pt-4 border-t border-neutral-850 text-center">
          <button
            onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
            className="text-[9px] font-mono text-neutral-500 hover:text-rose-400 flex items-center justify-center gap-1 mx-auto transition"
          >
            <HelpCircle className="w-3 h-3" />
            How do I enable auth providers?
          </button>
        </div>

        {/* Dynamic Inline Admin Guide */}
        {showFirebaseGuide && (
          <div className="mt-3 p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-left text-[10px] space-y-2 text-neutral-400 animate-fadeIn" id="auth-setup-assist-guide">
            <h4 className="font-mono font-bold text-rose-400 flex items-center gap-1 uppercase text-[9px]">
              <Info className="w-3 h-3" />
              Firebase Console Admin Guide
            </h4>
            <p className="leading-relaxed">
              If you receive <code>auth/operation-not-allowed</code>, you must enable these sign-in methods inside your Firebase console:
            </p>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[9px] text-neutral-300">
              <li>Open <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} target="_blank" rel="noreferrer" className="text-rose-400 underline">Firebase Auth Providers</a>.</li>
              <li>Click <strong>"Add new provider"</strong>.</li>
              <li>Choose <strong>Email/Password</strong> and enable it, then choose <strong>Google</strong> and enable it.</li>
              <li>Click save! Refresh this tab to re-verify authentication.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
