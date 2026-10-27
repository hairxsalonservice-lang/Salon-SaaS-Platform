"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { loginSalon } from "@/api/services/authService";
import { tokenStorage, parseApiError } from "@/lib/api-client";
import apiClient from "@/lib/api-client";
import { mapUser } from "@/lib/mapUser";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotStep, setForgotStep] = useState<0 | 1 | 2 | 3>(0);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const router = useRouter();
  const dispatch = useDispatch();

  async function handleForgotSubmit(): Promise<void> {
    if (!forgotEmail) { setForgotError("Please enter your email address."); return; }
    setForgotError("");
    setForgotLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email: forgotEmail.trim().toLowerCase() });
      setForgotStep(2);
    } catch (err) {
      setForgotError(parseApiError(err).message);
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetSubmit(): Promise<void> {
    if (!otp || !newPassword) { setForgotError("Please fill in all fields."); return; }
    if (newPassword !== confirmPassword) { setForgotError("Passwords do not match."); return; }
    setForgotError("");
    setForgotLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email: forgotEmail.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setForgotStep(3);
    } catch (err) {
      setForgotError(parseApiError(err).message);
    } finally {
      setForgotLoading(false);
    }
  }

  function closeForgot() {
    setForgotStep(0);
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
    setShowNewPassword(false);
  }

  async function handleLogin(): Promise<void> {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginSalon({
        email: email.trim().toLowerCase(),
        password,
      });

      const backendUser = data.data?.user;
      const accessToken = data.data?.accessToken;
      const refreshToken = data.data?.refreshToken;
      const salon = data.data?.salon;

      if (!backendUser || !accessToken) {
        throw new Error("Invalid credentials or server response.");
      }

      tokenStorage.setTokens(accessToken, refreshToken || "");
      const formattedUser = mapUser(backendUser);

      dispatch(
        loginSuccess({
          user: formattedUser,
          token: accessToken,
          salon,
        }),
      );

      router.push("/dashboard");
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-[#0071e3] selection:text-white">

      <div className="w-full max-w-[400px] mx-auto px-6">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="HairX"
            className="w-14 h-14 rounded-2xl object-cover shadow-sm mb-4"
          />
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#86868b] uppercase">
            HAIRX PARTNER
          </p>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f] mt-1">
            Sign in to your salon
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#d2d2d7]/60 shadow-sm p-7 space-y-5">
          <div className="space-y-4" onKeyDown={handleKeyDown}>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6e6e73]">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="w-full h-11 pl-10 pr-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[14px] font-medium text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-[#aeaeb2]" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#6e6e73]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full h-11 pl-10 pr-10 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[14px] font-medium text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-[#aeaeb2]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotStep(1)}
                className="text-[12px] font-medium text-[#0071e3] hover:text-[#0062c4] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 text-[#ff3b30] bg-[#ff3b30]/5 border border-[#ff3b30]/20 rounded-xl px-4 py-3 text-[12px] font-semibold animate-slide-in">
                <AlertCircle size={15} className="shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 bg-[#0071e3] hover:bg-[#0062c4] active:scale-[0.99] text-white text-[14px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] font-medium text-[#aeaeb2] mt-6">
          &copy; 2026 HairX. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#d2d2d7]/60 w-full max-w-md p-7 space-y-5 relative animate-slide-in">

            {forgotStep === 1 && (
              <>
                <button onClick={closeForgot} className="absolute top-5 left-5 text-[#aeaeb2] hover:text-[#1d1d1f] transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="pt-4">
                  <h3 className="text-lg font-semibold text-[#1d1d1f]">Forgot password</h3>
                  <p className="text-[13px] text-[#6e6e73] mt-1">Enter your email to receive a verification code.</p>
                </div>
                {forgotError && (
                  <div className="flex items-center gap-2 text-[#ff3b30] bg-[#ff3b30]/5 border border-[#ff3b30]/20 rounded-xl px-4 py-3 text-[12px] font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotSubmit()}
                    className="w-full h-11 pl-10 pr-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[14px] font-medium text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
                  />
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-[#aeaeb2]" />
                </div>
                <button onClick={handleForgotSubmit} disabled={forgotLoading} className="w-full h-11 bg-[#0071e3] hover:bg-[#0062c4] text-white text-[14px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {forgotLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Send Code"}
                </button>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <button onClick={() => setForgotStep(1)} className="absolute top-5 left-5 text-[#aeaeb2] hover:text-[#1d1d1f] transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="pt-4">
                  <h3 className="text-lg font-semibold text-[#1d1d1f]">Reset Password</h3>
                  <p className="text-[13px] text-[#6e6e73] mt-1">Enter the 6-digit code sent to your email and your new password.</p>
                </div>
                {forgotError && (
                  <div className="flex items-center gap-2 text-[#ff3b30] bg-[#ff3b30]/5 border border-[#ff3b30]/20 rounded-xl px-4 py-3 text-[12px] font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setForgotError(""); }}
                  className="w-full h-11 px-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[14px] font-bold text-center tracking-[0.3em] text-[#1d1d1f] placeholder:text-[#aeaeb2] placeholder:tracking-normal placeholder:font-medium focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
                />
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setForgotError(""); }}
                    className="w-full h-11 pl-10 pr-10 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[14px] font-medium text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-[#aeaeb2]" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-3.5 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors">
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setForgotError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleResetSubmit()}
                    className="w-full h-11 pl-10 pr-4 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[14px] font-medium text-[#1d1d1f] placeholder:text-[#aeaeb2] focus:bg-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-[#aeaeb2]" />
                </div>
                <button onClick={handleResetSubmit} disabled={forgotLoading} className="w-full h-11 bg-[#0071e3] hover:bg-[#0062c4] text-white text-[14px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {forgotLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Change Password"}
                </button>
              </>
            )}

            {forgotStep === 3 && (
              <div className="flex flex-col items-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#34c759]/10 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-[#34c759]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1d1d1f]">Password Reset</h3>
                <p className="text-[13px] text-[#6e6e73] text-center">Your password has been reset successfully.</p>
                <button onClick={closeForgot} className="h-11 px-8 bg-[#0071e3] hover:bg-[#0062c4] text-white text-[14px] font-semibold rounded-xl transition-all">
                  Back to Sign In
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
