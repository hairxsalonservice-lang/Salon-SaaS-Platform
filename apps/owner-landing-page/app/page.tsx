"use client";

import { useState } from "react";
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  Bell,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import apiClient, { parseApiError } from "@/lib/api-client";

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const SALON_PANEL_URL =
  process.env.NEXT_PUBLIC_SALON_PANEL_URL || "https://app.hairxsalon.com";

export default function LandingPage() {
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [salonDescription, setSalonDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({});
  const [submittedData, setSubmittedData] = useState<null | {
    _id: string;
    ownerName: string;
    ownerEmail: string;
    salonName: string;
  }>(null);

  const [activeGuideTab, setActiveGuideTab] = useState<
    "dashboard" | "bookings" | "branches" | "staff" | "reports"
  >("dashboard");

  const [branchCount, setBranchCount] = useState(2);
  const [dailyBookings, setDailyBookings] = useState(25);
  const [avgTicketPrice, setAvgTicketPrice] = useState(1200);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (salonName.trim().length < 2) errs.salonName = "Salon name is required (min 2 chars)";
    if (ownerName.trim().length < 2) errs.ownerName = "Owner name is required (min 2 chars)";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Please enter a valid email address";
    if (!phone.trim()) errs.phone = "Phone number is required";

    const passwordRules: [RegExp, string][] = [
      [/^.{8,}$/, "At least 8 characters"],
      [/[A-Z]/, "An uppercase letter"],
      [/[0-9]/, "A number"],
      [/[!@#$%^&*]/, "A special character (!@#$%^&*)"],
    ];

    if (password) {
      const failed = passwordRules.find(([re]) => !re.test(password));
      if (failed) errs.password = `Password requires: ${failed[1]}`;
    } else {
      errs.password = "Password is required";
    }

    if (confirmPassword !== password) errs.confirmPassword = "Passwords do not match";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errs = validateForm();
    setFieldErrs(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const sanitizedPhone = phone.trim().replace(/[^\d+]/g, "");
      const { data } = await apiClient.post("/auth/register-owner", {
        ownerName: ownerName.trim(),
        ownerEmail: email.trim().toLowerCase(),
        ownerPhone: sanitizedPhone,
        salonName: salonName.trim(),
        salonDescription: salonDescription.trim() || undefined,
        password,
      });

      setSubmittedData(
        data.data?.request ?? {
          _id: "",
          ownerName: ownerName.trim(),
          ownerEmail: email.trim().toLowerCase(),
          salonName: salonName.trim(),
        }
      );
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      const first = parsed.errors?.[0]?.message;
      setError(first || parsed.message || "Failed to submit registration request.");
    } finally {
      setLoading(false);
    }
  }

  const estimatedMonthlyBookings = dailyBookings * 30 * branchCount;
  const estimatedMonthlyRevenue = estimatedMonthlyBookings * avgTicketPrice;
  const estimatedTimeSavedHours = Math.round(branchCount * 18);

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] flex flex-col font-sans">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#d2d2d7]/60">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="HairX" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-semibold text-[17px] tracking-tight">
              Hair<span className="font-bold">X</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#6e6e73]">
            <a href="#benefits" className="hover:text-[#1d1d1f] transition-colors">Benefits</a>
            <a href="#guide" className="hover:text-[#1d1d1f] transition-colors">How It Works</a>
            <a href="#roi" className="hover:text-[#1d1d1f] transition-colors">ROI Calculator</a>
            <a href="#faq" className="hover:text-[#1d1d1f] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={SALON_PANEL_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex text-[13px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
            >
              Sign In
            </a>
            <a
              href="#register"
              className="text-[13px] font-medium text-white bg-[#1d1d1f] hover:bg-[#333336] px-5 py-2 rounded-full transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="pt-24 sm:pt-32 pb-20 px-6">
        <div className="max-w-[980px] mx-auto text-center">
          <p className="text-[13px] sm:text-sm font-semibold text-[#6e6e73] uppercase tracking-widest mb-5">
            Salon Management Platform
          </p>

          <h1 className="text-[44px] sm:text-[64px] lg:text-[80px] font-bold tracking-[-0.03em] leading-[1.05] text-[#1d1d1f]">
            Scale your salon.
            <br />
            <span className="gradient-text-accent">Effortlessly.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#6e6e73] max-w-[600px] mx-auto leading-relaxed font-normal">
            Multi-branch management, automated bookings, staff scheduling, and real-time analytics — all in one platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#register"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1d1d1f] hover:bg-[#333336] text-white text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 transition-all"
            >
              Register Your Salon <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#guide"
              className="w-full sm:w-auto px-8 py-3.5 text-[#1d1d1f] text-[15px] font-semibold rounded-full border border-[#d2d2d7] hover:border-[#86868b] flex items-center justify-center gap-2 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#d2d2d7]">
          <div className="text-center px-6 py-2">
            <p className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[#1d1d1f]">24h</p>
            <p className="text-[13px] text-[#86868b] mt-1">Fast Approval</p>
          </div>
          <div className="text-center px-6 py-2">
            <p className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[#1d1d1f]">Real-Time</p>
            <p className="text-[13px] text-[#86868b] mt-1">Slot Updates</p>
          </div>
          <div className="text-center px-6 py-2">
            <p className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[#1d1d1f]">Multi</p>
            <p className="text-[13px] text-[#86868b] mt-1">Branch Control</p>
          </div>
          <div className="text-center px-6 py-2">
            <p className="text-[28px] sm:text-[36px] font-bold tracking-tight text-[#1d1d1f]">Free</p>
            <p className="text-[13px] text-[#86868b] mt-1">Onboarding</p>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ───────────────────────────────────────── */}
      <section id="benefits" className="py-24 px-6 bg-[#f5f5f7]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <h2 className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest mb-4">
              Why Salon Owners Choose HairX
            </h2>
            <p className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">
              Everything you need to run and grow your salon.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                color: "#2563eb",
                title: "Multi-Branch Management",
                desc: "Control multiple locations from one dashboard. Assign managers, customize hours, and set unique services per branch.",
                features: ["Location-based pricing", "Branch-specific staff"],
              },
              {
                icon: Calendar,
                color: "#0d9488",
                title: "Automated Slot Booking",
                desc: "Real-time availability computed from staff hours, active leaves, and duration offsets. Zero double bookings.",
                features: ["Instant confirmations", "Dynamic rescheduling"],
              },
              {
                icon: Users,
                color: "#d97706",
                title: "Staff & Leave Management",
                desc: "Staff request leaves, owners approve — affected slots auto-lock. Commission tracking built in.",
                features: ["Self-service leaves", "Commission calculations"],
              },
              {
                icon: TrendingUp,
                color: "#7c3aed",
                title: "Financial Reports",
                desc: "Revenue per branch, top stylists, popular services, daily counts — all visualized on your dashboard.",
                features: ["Exportable summaries", "Per-stylist metrics"],
              },
              {
                icon: Bell,
                color: "#e11d48",
                title: "Real-Time Alerts",
                desc: "Instant WebSocket notifications when clients book, change, or cancel. Never miss an update.",
                features: ["In-app notifications", "Auto customer updates"],
              },
              {
                icon: ShieldCheck,
                color: "#059669",
                title: "Secure & Multi-Tenant",
                desc: "JWT authentication, admin-verified onboarding, and role-based access keep your data isolated and safe.",
                features: ["Admin-verified onboarding", "Owner, Manager, Staff roles"],
              },
            ].map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 flex flex-col transition-shadow hover:shadow-lg"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: `${b.color}10`, color: b.color }}
                >
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">{b.title}</h3>
                <p className="text-[14px] text-[#6e6e73] leading-relaxed flex-1">{b.desc}</p>
                <div className="mt-5 pt-4 border-t border-[#f5f5f7] space-y-2">
                  {b.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-[13px] text-[#1d1d1f]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: b.color }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section id="guide" className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <h2 className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest mb-4">
              How It Works
            </h2>
            <p className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">
              Up and running in four simple steps.
            </p>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              { step: "01", title: "Self-Register", desc: "Fill out the registration form with your salon details.", color: "#2563eb" },
              { step: "02", title: "Get Approved", desc: "Platform admins verify and activate your account within 24 hours.", color: "#0d9488" },
              { step: "03", title: "Configure", desc: "Add branches, set up services, invite staff members.", color: "#d97706" },
              { step: "04", title: "Grow", desc: "Receive appointments, manage schedules, track revenue.", color: "#7c3aed" },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="text-[64px] font-bold leading-none tracking-tight" style={{ color: `${s.color}15` }}>
                  {s.step}
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mt-3 mb-2">{s.title}</h3>
                <p className="text-[14px] text-[#6e6e73] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Panel Simulator */}
          <div className="bg-[#1d1d1f] rounded-3xl p-6 sm:p-8 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <p className="text-[13px] font-medium text-white/50 uppercase tracking-wide">Live Preview</p>
                <h3 className="text-[20px] font-semibold text-white mt-0.5">Salon Owner Dashboard</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["dashboard", "bookings", "branches", "staff", "reports"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveGuideTab(tab)}
                    className={`px-4 py-2 text-[13px] font-medium rounded-full capitalize transition-all ${
                      activeGuideTab === tab
                        ? "bg-white text-[#1d1d1f]"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 min-h-[280px]">
              {activeGuideTab === "dashboard" && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 backdrop-blur p-5 rounded-2xl border border-white/10">
                      <p className="text-[12px] text-white/50 font-medium">Today&apos;s Revenue</p>
                      <p className="text-[28px] font-bold text-white mt-1">₹18,450</p>
                      <p className="text-[12px] text-emerald-400 mt-1">↑ 14% vs yesterday</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur p-5 rounded-2xl border border-white/10">
                      <p className="text-[12px] text-white/50 font-medium">Active Bookings</p>
                      <p className="text-[28px] font-bold text-white mt-1">16</p>
                      <p className="text-[12px] text-white/40 mt-1">4 pending confirmation</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur p-5 rounded-2xl border border-white/10">
                      <p className="text-[12px] text-white/50 font-medium">Active Staff Today</p>
                      <p className="text-[28px] font-bold text-white mt-1">8</p>
                      <p className="text-[12px] text-white/40 mt-1">2 branches operating</p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "bookings" && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-white">Aria Sharma · Hair Styling & Highlights</p>
                      <p className="text-[12px] text-white/40 mt-1">02:30 PM – 03:30 PM · Stylist: Rahul V.</p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/15 text-amber-400 text-[12px] font-semibold rounded-full">Pending</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-white">Rohan Gupta · Premium Facial & Beard Trim</p>
                      <p className="text-[12px] text-white/40 mt-1">04:00 PM – 05:00 PM · Stylist: Vikram K.</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 text-[12px] font-semibold rounded-full">Confirmed</span>
                  </div>
                </div>
              )}

              {activeGuideTab === "branches" && (
                <div className="grid sm:grid-cols-2 gap-4 animate-fade-in-up">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                    <p className="text-[15px] font-semibold text-white">Downtown Luxury Salon</p>
                    <p className="text-[13px] text-white/40 mt-1">Connaught Place, New Delhi</p>
                    <div className="mt-3 flex items-center gap-3 text-[12px] text-white/60">
                      <span>Staff: 6</span> · <span>09:00 AM – 08:00 PM</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                    <p className="text-[15px] font-semibold text-white">Westside Boutique Salon</p>
                    <p className="text-[13px] text-white/40 mt-1">Bandra West, Mumbai</p>
                    <div className="mt-3 flex items-center gap-3 text-[12px] text-white/60">
                      <span>Staff: 4</span> · <span>10:00 AM – 09:00 PM</span>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "staff" && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-white">Priya Sen — Senior Hair Specialist</p>
                      <p className="text-[12px] text-white/40 mt-1">Leave requested: Aug 18, 2026 (Personal)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-1.5 bg-emerald-500 text-white text-[12px] font-semibold rounded-full">Approve</button>
                      <button className="px-4 py-1.5 bg-white/10 text-white/60 text-[12px] font-semibold rounded-full">Reject</button>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "reports" && (
                <div className="space-y-5 animate-fade-in-up">
                  <div>
                    <div className="flex justify-between text-[13px] text-white/80 mb-2">
                      <span>Hair Styling & Coloring</span>
                      <span className="font-semibold text-white">₹1,45,000 (45%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px] text-white/80 mb-2">
                      <span>Facials & Skincare</span>
                      <span className="font-semibold text-white">₹95,000 (30%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full" style={{ width: "30%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[13px] text-white/80 mb-2">
                      <span>Beard & Grooming</span>
                      <span className="font-semibold text-white">₹80,000 (25%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ─────────────────────────────────── */}
      <section id="roi" className="py-24 px-6 bg-[#f5f5f7]">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <h2 className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest mb-4">
              Growth Estimator
            </h2>
            <p className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">
              See your potential.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 grid md:grid-cols-2 gap-10 items-center">
            {/* Sliders */}
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-[14px] font-medium mb-3">
                  <span className="text-[#6e6e73]">Salon Branches</span>
                  <span className="text-[#1d1d1f] font-semibold text-[17px]">{branchCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={branchCount}
                  onChange={(e) => setBranchCount(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[14px] font-medium mb-3">
                  <span className="text-[#6e6e73]">Daily Bookings / Branch</span>
                  <span className="text-[#1d1d1f] font-semibold text-[17px]">{dailyBookings}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={dailyBookings}
                  onChange={(e) => setDailyBookings(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[14px] font-medium mb-3">
                  <span className="text-[#6e6e73]">Avg. Booking Value</span>
                  <span className="text-[#1d1d1f] font-semibold text-[17px]">₹{avgTicketPrice}</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="100"
                  value={avgTicketPrice}
                  onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Results */}
            <div className="text-center space-y-6">
              <div>
                <p className="text-[12px] uppercase font-semibold text-[#86868b] tracking-wider">Monthly Volume</p>
                <p className="text-[36px] font-bold tracking-tight text-[#1d1d1f] mt-1">
                  {estimatedMonthlyBookings.toLocaleString()}
                </p>
                <p className="text-[13px] text-[#86868b]">bookings</p>
              </div>

              <div className="border-t border-[#f5f5f7] pt-6">
                <p className="text-[12px] uppercase font-semibold text-[#86868b] tracking-wider">Projected Revenue</p>
                <p className="text-[44px] font-bold tracking-tight gradient-text-accent mt-1">
                  ₹{estimatedMonthlyRevenue.toLocaleString()}
                </p>
                <p className="text-[13px] text-[#86868b]">per month</p>
              </div>

              <div className="border-t border-[#f5f5f7] pt-6">
                <p className="text-[12px] uppercase font-semibold text-[#86868b] tracking-wider">Admin Time Saved</p>
                <p className="text-[28px] font-bold tracking-tight text-[#1d1d1f] mt-1">
                  ~{estimatedTimeSavedHours} hrs
                </p>
                <p className="text-[13px] text-[#86868b]">per week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REGISTRATION ───────────────────────────────────── */}
      <section id="register" className="py-24 px-6">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[13px] font-semibold text-[#6e6e73] uppercase tracking-widest mb-4">
              Get Started
            </h2>
            <p className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">
              Register your salon.
            </p>
            <p className="text-[15px] text-[#6e6e73] mt-4 max-w-[480px] mx-auto">
              Submit your details below. Our team reviews and activates accounts within 24 hours.
            </p>
          </div>

          {submittedData ? (
            <div className="bg-[#f5f5f7] rounded-3xl p-10 text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-600 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-[24px] sm:text-[28px] font-bold text-[#1d1d1f]">
                Registration Submitted
              </h3>
              <p className="text-[15px] text-[#6e6e73] mt-3 max-w-md mx-auto">
                Thank you, <span className="text-[#1d1d1f] font-semibold">{submittedData.ownerName}</span>. Your salon{" "}
                <span className="font-semibold">&ldquo;{submittedData.salonName}&rdquo;</span> is queued for review.
              </p>

              <div className="mt-8 bg-white rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 text-[13px] text-[#6e6e73]">
                <p className="font-semibold text-[#86868b] uppercase tracking-wider text-[11px]">What happens next</p>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p>Admin verifies your salon details.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p>Account approved within 24 hours.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p>Log in with <span className="text-[#1d1d1f] font-medium">{submittedData.ownerEmail}</span>.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={SALON_PANEL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-[#1d1d1f] hover:bg-[#333336] text-white text-[14px] font-semibold rounded-full flex items-center gap-2 transition-all"
                >
                  Go to Salon Panel <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setSalonName("");
                    setOwnerName("");
                    setEmail("");
                    setPhone("");
                    setPassword("");
                    setConfirmPassword("");
                    setSalonDescription("");
                  }}
                  className="text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] underline underline-offset-2 py-2 transition-colors"
                >
                  Submit another registration
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-[13px] flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                    Salon Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HairX Salon & Beauty Studio"
                    value={salonName}
                    onChange={(e) => { setSalonName(e.target.value); setFieldErrs((p) => ({ ...p, salonName: "" })); }}
                    className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                  />
                  {fieldErrs.salonName && <p className="text-[12px] text-red-500 mt-1">{fieldErrs.salonName}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                    Owner Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Roy"
                    value={ownerName}
                    onChange={(e) => { setOwnerName(e.target.value); setFieldErrs((p) => ({ ...p, ownerName: "" })); }}
                    className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                  />
                  {fieldErrs.ownerName && <p className="text-[12px] text-red-500 mt-1">{fieldErrs.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFieldErrs((p) => ({ ...p, phone: "" })); }}
                    className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                  />
                  {fieldErrs.phone && <p className="text-[12px] text-red-500 mt-1">{fieldErrs.phone}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="owner@yoursalon.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrs((p) => ({ ...p, email: "" })); }}
                    className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                  />
                  {fieldErrs.email && <p className="text-[12px] text-red-500 mt-1">{fieldErrs.email}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrs((p) => ({ ...p, password: "", confirmPassword: "" })); }}
                    className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                  />
                  {fieldErrs.password && <p className="text-[12px] text-red-500 mt-1">{fieldErrs.password}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrs((p) => ({ ...p, confirmPassword: "" })); }}
                    className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                  />
                  {fieldErrs.confirmPassword && <p className="text-[12px] text-red-500 mt-1">{fieldErrs.confirmPassword}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">
                  Salon Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your salon, locations, team size, and services..."
                  value={salonDescription}
                  onChange={(e) => setSalonDescription(e.target.value)}
                  className="w-full bg-[#f5f5f7] border border-transparent rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all resize-none"
                />
              </div>

              <p className="text-[12px] text-[#86868b]">
                Password must be at least 8 characters with 1 uppercase, 1 number & 1 special character.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1d1d1f] hover:bg-[#333336] disabled:opacity-50 text-white font-semibold text-[15px] rounded-full transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Submitting..." : (<>Submit Registration <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-[#f5f5f7]">
        <div className="max-w-[680px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">
              Frequently asked questions.
            </h2>
          </div>

          <div className="space-y-0 divide-y divide-[#d2d2d7]">
            {[
              {
                q: "Why is my registration held for admin approval?",
                a: "To ensure platform integrity and security, our admin team verifies each new salon before activating the owner account. This typically takes under 24 hours.",
              },
              {
                q: "Can I manage multiple branches under one account?",
                a: "Absolutely. HairX natively supports multi-branch management. Once approved, you can create and manage unlimited branch locations from your owner panel.",
              },
              {
                q: "How do customer appointments work?",
                a: "Customers use the HairX mobile app to select a branch, pick a service and stylist, and book available time slots in real time. You manage everything from your dashboard.",
              },
              {
                q: "How do staff leaves affect booking slots?",
                a: "When a staff member's leave is approved, their slots are automatically blocked for that period — preventing any double-booking or scheduling conflicts.",
              },
            ].map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full py-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-[15px] sm:text-[17px] font-semibold text-[#1d1d1f]">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[#86868b] transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="pb-5 text-[14px] sm:text-[15px] text-[#6e6e73] leading-relaxed -mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">
            Ready to transform your salon?
          </h2>
          <p className="text-[15px] text-[#6e6e73] mt-4">
            Join HairX today and start managing your business the modern way.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#register"
              className="px-8 py-3.5 bg-[#1d1d1f] hover:bg-[#333336] text-white text-[15px] font-semibold rounded-full flex items-center gap-2 transition-all"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={SALON_PANEL_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[15px] font-semibold text-[#0071e3] hover:underline flex items-center gap-1 transition-colors"
            >
              Sign in to Salon Panel <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-[#d2d2d7]">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="HairX" className="w-7 h-7 rounded-md object-cover" />
              <span className="font-semibold text-[14px] tracking-tight text-[#1d1d1f]">
                Hair<span className="font-bold">X</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[12px] text-[#6e6e73]">
              <a href="#benefits" className="hover:text-[#1d1d1f] transition-colors">Benefits</a>
              <a href="#guide" className="hover:text-[#1d1d1f] transition-colors">How It Works</a>
              <a href="#roi" className="hover:text-[#1d1d1f] transition-colors">Calculator</a>
              <a href="#register" className="hover:text-[#1d1d1f] transition-colors">Register</a>
              <a href={SALON_PANEL_URL} target="_blank" rel="noreferrer" className="hover:text-[#1d1d1f] transition-colors">Salon Panel</a>
              <a href="/terms" className="hover:text-[#1d1d1f] transition-colors">Terms</a>
              <a href="/privacy-policy" className="hover:text-[#1d1d1f] transition-colors">Privacy</a>
            </div>

            <p className="text-[12px] text-[#86868b]">© 2026 HairX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
