import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { forgotPassword } from "@/lib/auth";
import { GraduationCap, ArrowLeft, Mail, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
});

function ForgotPassword() {
  const forgotFn = useServerFn(forgotPassword);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = (await forgotFn({ data: { email } })) as { ok: boolean; token?: string };
      if (result.token) setToken(result.token);
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Photo panel ── */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] relative overflow-hidden shrink-0">
        <img
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop&q=80"
          alt="Children learning"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/60 to-blue-950/70" />
        <div className="absolute inset-0 bg-blue-900/20" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-tight">SchoolNest</div>
              <div className="text-[11px] text-blue-300 leading-tight">Preschool ERP</div>
            </div>
          </Link>

          {/* Centre content */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            {/* Big icon */}
            <div className="w-20 h-20 bg-white/10 border border-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8">
              <KeyRound className="w-10 h-10 text-sky-300" />
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Account<br />
              <span className="text-sky-300">recovery</span>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-10">
              We'll send a secure password reset link to your registered email address. The link expires in 15 minutes.
            </p>

            {/* Security steps */}
            <div className="space-y-4">
              {[
                { step: "1", text: "Enter your work email below" },
                { step: "2", text: "Check your inbox for the reset link" },
                { step: "3", text: "Set a new strong password" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-blue-600/40 border border-blue-500/40 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-200">{step}</span>
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </div>
              ))}
            </div>

            {/* Security badge */}
            <div className="mt-10 flex items-center gap-2.5 bg-white/8 border border-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-300 leading-snug">
                Industry-standard security. Your identity is verified before access is restored.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">&copy; {new Date().getFullYear()} SchoolNest Technologies</div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 relative">
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">SchoolNest</span>
          </Link>

          {!sent ? (
            /* ── Request form card ── */
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 xl:p-10">
              {/* Back */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-7 transition group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to sign in
              </Link>

              {/* Icon + heading */}
              <div className="mb-7">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-md shadow-blue-200">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Forgot your password?</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  No worries — enter your work email and we'll send a reset link instantly.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition placeholder:text-slate-400"
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[10px] font-bold">!</span>
                    </div>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition shadow-md shadow-blue-200"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>Send reset link <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs text-center text-slate-400">
                  Remember your password?{" "}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
                </p>
              </div>
            </div>

          ) : (
            /* ── Success card ── */
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 xl:p-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-1">
                If <span className="font-semibold text-slate-700">{email}</span> is registered with SchoolNest, you'll receive a reset link shortly.
              </p>
              <p className="text-slate-400 text-xs mb-7">Didn't receive it? Check your spam folder or try again.</p>

              {/* Dev-only token */}
              {token && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Dev mode — reset token</p>
                  <p className="text-xs text-amber-800 font-mono break-all leading-relaxed">{token}</p>
                  <Link to="/reset-password" className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold mt-2 hover:underline">
                    Go to reset page <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setSent(false); setToken(""); setEmail(""); }}
                  className="w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-semibold text-sm transition"
                >
                  Try a different email
                </button>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-blue-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}

          {/* Trust row */}
          <div className="flex items-center justify-center gap-5 mt-6">
            {[
              { icon: ShieldCheck, label: "256-bit SSL" },
              { icon: ShieldCheck, label: "Link expires in 15 min" },
              { icon: ShieldCheck, label: "Secure delivery" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Icon className="w-3.5 h-3.5 text-emerald-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
