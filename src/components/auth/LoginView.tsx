import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Mail, ArrowRight, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, verifyOtp } = useApp();
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid executive email address.');
      return;
    }
    setError(null);
    login(email, name);
    setStep('OTP');
    setResendCooldown(30);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }
    const success = verifyOtp(code);
    if (success) {
      onLoginSuccess();
    } else {
      setError('Verification failed. Please try again.');
    }
  };

  const handleQuickDemoLogin = (demoEmail: string, demoName: string) => {
    login(demoEmail, demoName);
    verifyOtp('123456');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 items-center justify-center shadow-xl font-serif text-2xl font-bold text-white mb-4 border border-teal-400/30">
            K
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white">
            Kindlytics
          </h1>
          <p className="mt-2 text-sm text-slate-400 tracking-wide font-medium">
            Leadership Intelligence. Made Visible.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-850/90 backdrop-blur-xl border border-slate-750 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Name
                </label>
                <div className="mt-1.5">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="block w-full rounded-xl bg-slate-800/90 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address
                </label>
                <div className="mt-1.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="block w-full rounded-xl bg-slate-800/90 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 shadow-md shadow-teal-900/30 transition active:scale-[0.99]"
              >
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Verify Your Identity</h3>
                <p className="mt-1 text-xs text-slate-400">
                  We've sent a verification code to <span className="text-teal-300">{email}</span>
                </p>
                <p className="text-[11px] text-teal-400/80 mt-1 font-mono">
                  (Prototype: enter any 6 digits to authenticate)
                </p>
              </div>

              {/* 6 OTP Fields */}
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-mono font-bold rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition"
                  />
                ))}
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 shadow-md transition"
              >
                Verify & Continue
              </button>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  className="hover:text-white transition"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={() => setResendCooldown(30)}
                  className="hover:text-teal-300 disabled:opacity-50 transition"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Accounts Access */}
          <div className="mt-8 pt-6 border-t border-slate-750">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Demo Personas (Section 10)
              </span>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sarah@kindlytics.com', 'Sarah Ahmed')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-750 border border-slate-700/80 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-teal-300 group-hover:text-teal-200">
                    Sarah Ahmed (USER)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Demonstrates contextual permissions: SELF in own, PEER for Alex
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-300 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('alex@kindlytics.com', 'Alex Morgan')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-750 border border-slate-700/80 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-blue-300 group-hover:text-blue-200">
                    Alex Morgan (USER)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Assessment Subject with peer assessors & active diagnostic
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-300 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@kindlytics.com', 'Kindlytics Admin')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-750 border border-slate-700/80 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-amber-300 group-hover:text-amber-200">
                    Kindlytics Admin (ADMIN)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    User management, 150-question bank, configurations
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
