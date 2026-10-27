"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Play,
  Scissors,
  MapPin,
  Clock,
  Star,
} from "lucide-react";
import apiClient, { parseApiError } from "@/lib/api-client";
import ThemeToggle from "@/lib/ThemeToggle";

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const SALON_PANEL_URL =
  process.env.NEXT_PUBLIC_SALON_PANEL_URL || "https://app.hairxsalon.com";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll(".reveal").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

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

  const heroRef = useScrollReveal();
  const benefitsRef = useScrollReveal();
  const guideRef = useScrollReveal();
  const roiRef = useScrollReveal();
  const registerRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const ctaRef = useScrollReveal();

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
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col font-sans transition-colors duration-250">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-2xl border-b border-[#d2d2d7]/40 dark:border-white/10 transition-colors duration-250">
        <div className="max-w-[1200px] mx-auto px-6 h-12 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="HairX" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-semibold text-[15px] tracking-tight text-[#1d1d1f] dark:text-white">
              Hair<span className="font-bold">X</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-[12px] font-medium text-[#6e6e73] dark:text-[#a1a1a6]">
            <a href="#benefits" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Benefits</a>
            <a href="#guide" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">How It Works</a>
            <a href="#roi" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Calculator</a>
            <a href="#faq" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">FAQ</a>
            <a href={SALON_PANEL_URL} target="_blank" rel="noreferrer" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">
              Sign In
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <a
              href="#register"
              className="text-[12px] font-medium text-white bg-[#1d1d1f] hover:bg-[#424245] dark:bg-white dark:text-[#09090b] dark:hover:bg-[#e5e5ea] px-4 py-1.5 rounded-full transition-all btn-press shadow-sm"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-20 sm:pt-28 pb-24 px-6 overflow-hidden bg-white dark:bg-[#09090b] transition-colors duration-250" ref={heroRef}>
        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-400/8 dark:bg-blue-500/15 rounded-full blur-[100px] hero-orb" />
          <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-violet-400/8 dark:bg-violet-500/15 rounded-full blur-[80px] hero-orb-2" />
          <div className="absolute bottom-0 left-10 w-[250px] h-[250px] bg-pink-300/6 dark:bg-pink-500/10 rounded-full blur-[80px] hero-orb" />
        </div>

        <div className="max-w-[980px] mx-auto text-center relative z-10">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f5f5f7] dark:bg-white/[0.06] border border-transparent dark:border-white/10 text-[12px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6] mb-8">
              <Scissors className="w-3.5 h-3.5" />
              The modern salon management platform
            </div>
          </div>

          <h1 className="reveal reveal-delay-1 text-[44px] sm:text-[64px] lg:text-[80px] font-bold tracking-[-0.035em] leading-[1.05] text-[#1d1d1f] dark:text-white">
            Scale your salon.
            <br />
            <span className="gradient-text-accent">Effortlessly.</span>
          </h1>

          <p className="reveal reveal-delay-2 mt-6 text-[17px] sm:text-[20px] text-[#6e6e73] dark:text-[#a1a1a6] max-w-[600px] mx-auto leading-relaxed font-normal">
            Multi-branch management, automated bookings, staff scheduling, and real-time analytics — all in one platform.
          </p>

          <div className="reveal reveal-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#register"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1d1d1f] hover:bg-[#424245] dark:bg-white dark:text-[#09090b] dark:hover:bg-[#e5e5ea] text-white text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 transition-all btn-press shadow-lg shadow-black/10 dark:shadow-black/40"
            >
              Register Your Salon <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#guide"
              className="w-full sm:w-auto px-8 py-3.5 text-[#1d1d1f] dark:text-white text-[15px] font-semibold rounded-full border border-[#d2d2d7] dark:border-white/20 hover:border-[#86868b] dark:hover:border-white/40 hover:bg-[#f5f5f7] dark:hover:bg-white/10 flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4" /> See How It Works
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="reveal reveal-delay-4 mt-24 max-w-[900px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "24h", label: "Account Approval", icon: Clock },
              { value: "Real-Time", label: "Slot Updates", icon: Bell },
              { value: "Multi", label: "Branch Control", icon: MapPin },
              { value: "Free", label: "Onboarding", icon: Star },
            ].map((s, i) => (
              <div key={i} className="text-center group">
                <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] dark:bg-white/[0.06] group-hover:bg-[#e8e8ed] dark:group-hover:bg-white/[0.1] transition-colors flex items-center justify-center mx-auto mb-3">
                  <s.icon className="w-4.5 h-4.5 text-[#6e6e73] dark:text-[#a1a1a6]" />
                </div>
                <p className="text-[24px] sm:text-[28px] font-bold tracking-tight text-[#1d1d1f] dark:text-white stat-number">{s.value}</p>
                <p className="text-[12px] text-[#86868b] dark:text-[#71717a] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ───────────────────────────────────────── */}
      <section id="benefits" className="py-28 px-6 bg-[#f5f5f7] dark:bg-[#0f0f12] transition-colors duration-250" ref={benefitsRef}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="reveal text-[13px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6] uppercase tracking-widest mb-4">
              Why Salon Owners Choose HairX
            </p>
            <h2 className="reveal reveal-delay-1 text-[32px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1d1d1f] dark:text-white">
              Everything you need.
              <br />
              <span className="text-[#86868b] dark:text-[#71717a]">Nothing you don&apos;t.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Building2, color: "#2563eb", bg: "#eff6ff",
                title: "Multi-Branch Management",
                desc: "Control multiple locations from one dashboard. Assign managers, customize hours, and set unique services per branch.",
                features: ["Location-based pricing", "Branch-specific staff allocation"],
              },
              {
                icon: Calendar, color: "#0d9488", bg: "#f0fdfa",
                title: "Automated Slot Booking",
                desc: "Real-time availability computed from staff hours, active leaves, and duration offsets. Zero double bookings.",
                features: ["Instant confirmations", "Dynamic rescheduling"],
              },
              {
                icon: Users, color: "#d97706", bg: "#fffbeb",
                title: "Staff & Leave Management",
                desc: "Staff request leaves, owners approve — affected slots auto-lock. Commission tracking built in.",
                features: ["Self-service leave requests", "Commission calculations"],
              },
              {
                icon: TrendingUp, color: "#7c3aed", bg: "#f5f3ff",
                title: "Financial Reports & Insights",
                desc: "Revenue per branch, top stylists, popular services, daily counts — all visualized on your dashboard.",
                features: ["Exportable summaries", "Per-stylist metrics"],
              },
              {
                icon: Bell, color: "#e11d48", bg: "#fff1f2",
                title: "Real-Time WebSocket Alerts",
                desc: "Instant notifications when clients book, change, or cancel. Never miss an update.",
                features: ["In-app notifications", "Auto customer updates"],
              },
              {
                icon: ShieldCheck, color: "#059669", bg: "#ecfdf5",
                title: "Secure & Multi-Tenant",
                desc: "JWT authentication, admin-verified onboarding, and role-based access keep your data completely isolated.",
                features: ["Admin-verified onboarding", "Owner · Manager · Staff roles"],
              },
            ].map((b, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${(i % 3) + 1} bg-white dark:bg-[#16161a] border border-transparent dark:border-white/[0.07] rounded-[20px] p-7 flex flex-col card-hover shadow-sm`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: b.bg, color: b.color }}
                >
                  <b.icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-2">{b.title}</h3>
                <p className="text-[14px] text-[#6e6e73] dark:text-[#a1a1a6] leading-[1.6] flex-1">{b.desc}</p>
                <div className="mt-5 pt-4 border-t border-[#f5f5f7] dark:border-white/[0.06] space-y-2.5">
                  {b.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2.5 text-[13px] text-[#1d1d1f] dark:text-[#e4e4e7]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: b.color }} />
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
      <section id="guide" className="py-28 px-6 bg-white dark:bg-[#09090b] transition-colors duration-250" ref={guideRef}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[680px] mx-auto mb-16">
            <p className="reveal text-[13px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6] uppercase tracking-widest mb-4">
              How It Works
            </p>
            <h2 className="reveal reveal-delay-1 text-[32px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1d1d1f] dark:text-white">
              Up and running
              <br />
              <span className="text-[#86868b] dark:text-[#71717a]">in four steps.</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {[
              { step: "01", title: "Self-Register", desc: "Fill out the registration form with your salon and contact details.", color: "#2563eb" },
              { step: "02", title: "Get Approved", desc: "Our admin team reviews and activates your account within 24 hours.", color: "#0d9488" },
              { step: "03", title: "Configure", desc: "Add your branches, set up services, and invite your staff members.", color: "#d97706" },
              { step: "04", title: "Grow", desc: "Receive live appointments, manage schedules, and track revenue growth.", color: "#7c3aed" },
            ].map((s, i) => (
              <div key={i} className={`reveal reveal-delay-${i + 1} relative group`}>
                <div
                  className="text-[72px] font-black leading-none tracking-tighter transition-colors duration-300 dark:opacity-40"
                  style={{ color: `${s.color}20` }}
                >
                  {s.step}
                </div>
                <div className="w-8 h-0.5 rounded-full mt-4 mb-3 transition-all duration-300 group-hover:w-12" style={{ backgroundColor: s.color }} />
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-2">{s.title}</h3>
                <p className="text-[14px] text-[#6e6e73] dark:text-[#a1a1a6] leading-[1.6]">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Panel Simulator */}
          <div className="reveal bg-[#1d1d1f] dark:bg-[#141417] border border-white/8 dark:border-white/10 rounded-[28px] p-6 sm:p-10 overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
              <div>
                <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">Live Preview</p>
                <h3 className="text-[22px] font-semibold text-white mt-1">Salon Owner Dashboard</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["dashboard", "bookings", "branches", "staff", "reports"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveGuideTab(tab)}
                    className={`px-4 py-2 text-[12px] font-medium rounded-full capitalize transition-all duration-200 cursor-pointer ${
                      activeGuideTab === tab
                        ? "bg-white text-[#1d1d1f] shadow-lg"
                        : "text-white/50 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 min-h-[280px]">
              {activeGuideTab === "dashboard" && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/[0.06]">
                      <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Today&apos;s Revenue</p>
                      <p className="text-[32px] font-bold text-white mt-2 stat-number">₹18,450</p>
                      <p className="text-[12px] text-emerald-400 mt-1.5 font-medium">↑ 14% vs yesterday</p>
                    </div>
                    <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/[0.06]">
                      <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Active Bookings</p>
                      <p className="text-[32px] font-bold text-white mt-2 stat-number">16</p>
                      <p className="text-[12px] text-white/30 mt-1.5">4 pending confirmation</p>
                    </div>
                    <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/[0.06]">
                      <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Active Staff</p>
                      <p className="text-[32px] font-bold text-white mt-2 stat-number">8</p>
                      <p className="text-[12px] text-white/30 mt-1.5">2 branches operating</p>
                    </div>
                  </div>
                </div>
              )}

              {activeGuideTab === "bookings" && (
                <div className="space-y-3 animate-fade-in-up">
                  {[
                    { name: "Aria Sharma", service: "Hair Styling & Highlights", time: "02:30 – 03:30 PM", stylist: "Rahul V.", status: "Pending", statusColor: "amber" },
                    { name: "Rohan Gupta", service: "Premium Facial & Beard Trim", time: "04:00 – 05:00 PM", stylist: "Vikram K.", status: "Confirmed", statusColor: "emerald" },
                    { name: "Meera Patel", service: "Keratin Treatment", time: "05:30 – 07:00 PM", stylist: "Priya S.", status: "Confirmed", statusColor: "emerald" },
                  ].map((b, i) => (
                    <div key={i} className="bg-white/[0.04] p-4 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-white">{b.name} · {b.service}</p>
                        <p className="text-[12px] text-white/35 mt-1">{b.time} · Stylist: {b.stylist}</p>
                      </div>
                      <span className={`px-3 py-1 text-[11px] font-semibold rounded-full ${
                        b.statusColor === "amber" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                      }`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeGuideTab === "branches" && (
                <div className="grid sm:grid-cols-2 gap-4 animate-fade-in-up">
                  {[
                    { name: "Downtown Luxury Salon", loc: "Connaught Place, New Delhi", staff: 6, hours: "09:00 AM – 08:00 PM" },
                    { name: "Westside Boutique Salon", loc: "Bandra West, Mumbai", staff: 4, hours: "10:00 AM – 09:00 PM" },
                  ].map((br, i) => (
                    <div key={i} className="bg-white/[0.04] p-6 rounded-2xl border border-white/[0.06]">
                      <p className="text-[15px] font-semibold text-white">{br.name}</p>
                      <p className="text-[13px] text-white/35 mt-1">{br.loc}</p>
                      <div className="mt-4 flex items-center gap-3 text-[12px] text-white/50">
                        <span>Staff: {br.staff}</span> · <span>{br.hours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeGuideTab === "staff" && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="bg-white/[0.04] p-5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-white">Priya Sen — Senior Hair Specialist</p>
                      <p className="text-[12px] text-white/35 mt-1">Leave requested: Aug 18, 2026 (Personal)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold rounded-full transition-colors cursor-pointer">Approve</button>
                      <button className="px-4 py-1.5 bg-white/8 hover:bg-white/12 text-white/60 text-[12px] font-semibold rounded-full transition-colors cursor-pointer">Reject</button>
                    </div>
                  </div>
                  <div className="bg-white/[0.04] p-5 rounded-2xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-white">Rahul Verma — Hair Colorist</p>
                      <p className="text-[12px] text-white/35 mt-1">Commission this month: ₹12,400</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold rounded-full">Active</span>
                  </div>
                </div>
              )}

              {activeGuideTab === "reports" && (
                <div className="space-y-5 animate-fade-in-up">
                  {[
                    { name: "Hair Styling & Coloring", amount: "₹1,45,000", pct: 45, color: "#3b82f6" },
                    { name: "Facials & Skincare", amount: "₹95,000", pct: 30, color: "#14b8a6" },
                    { name: "Beard & Grooming", amount: "₹80,000", pct: 25, color: "#8b5cf6" },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[13px] text-white/70 mb-2">
                        <span>{r.name}</span>
                        <span className="font-semibold text-white">{r.amount} ({r.pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ─────────────────────────────────── */}
      <section id="roi" className="py-28 px-6 bg-[#f5f5f7] dark:bg-[#0f0f12] transition-colors duration-250" ref={roiRef}>
        <div className="max-w-[980px] mx-auto">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <p className="reveal text-[13px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6] uppercase tracking-widest mb-4">
              Growth Estimator
            </p>
            <h2 className="reveal reveal-delay-1 text-[32px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1d1d1f] dark:text-white">
              See your potential.
            </h2>
          </div>

          <div className="reveal reveal-delay-2 bg-white dark:bg-[#16161a] border border-transparent dark:border-white/[0.07] rounded-[24px] p-8 sm:p-10 grid md:grid-cols-2 gap-12 items-center shadow-sm">
            <div className="space-y-8">
              {[
                { label: "Salon Branches", value: branchCount, min: 1, max: 10, step: 1, set: setBranchCount, display: String(branchCount) },
                { label: "Daily Bookings / Branch", value: dailyBookings, min: 5, max: 100, step: 5, set: setDailyBookings, display: String(dailyBookings) },
                { label: "Avg. Booking Value", value: avgTicketPrice, min: 300, max: 5000, step: 100, set: setAvgTicketPrice, display: `₹${avgTicketPrice}` },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[14px] mb-3">
                    <span className="text-[#6e6e73] dark:text-[#a1a1a6] font-medium">{s.label}</span>
                    <span className="text-[#1d1d1f] dark:text-white font-bold text-[18px] stat-number">{s.display}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.value}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="text-center space-y-8 py-4">
              <div>
                <p className="text-[11px] uppercase font-semibold text-[#86868b] dark:text-[#71717a] tracking-wider">Monthly Bookings</p>
                <p className="text-[40px] font-bold tracking-tight text-[#1d1d1f] dark:text-white mt-1 stat-number">
                  {estimatedMonthlyBookings.toLocaleString()}
                </p>
              </div>

              <div className="border-t border-[#f5f5f7] dark:border-white/[0.06] pt-8">
                <p className="text-[11px] uppercase font-semibold text-[#86868b] dark:text-[#71717a] tracking-wider">Projected Revenue</p>
                <p className="text-[48px] font-bold tracking-tight gradient-text-revenue mt-1 stat-number">
                  ₹{estimatedMonthlyRevenue.toLocaleString()}
                </p>
                <p className="text-[13px] text-[#86868b] dark:text-[#71717a] -mt-1">per month</p>
              </div>

              <div className="border-t border-[#f5f5f7] dark:border-white/[0.06] pt-8">
                <p className="text-[11px] uppercase font-semibold text-[#86868b] dark:text-[#71717a] tracking-wider">Admin Time Saved</p>
                <p className="text-[32px] font-bold tracking-tight text-[#1d1d1f] dark:text-white mt-1">
                  ~{estimatedTimeSavedHours} hrs<span className="text-[16px] text-[#86868b] dark:text-[#71717a] font-medium">/week</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REGISTRATION ───────────────────────────────────── */}
      <section id="register" className="py-28 px-6 bg-white dark:bg-[#09090b] transition-colors duration-250" ref={registerRef}>
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-12">
            <p className="reveal text-[13px] font-semibold text-[#6e6e73] dark:text-[#a1a1a6] uppercase tracking-widest mb-4">
              Get Started Today
            </p>
            <h2 className="reveal reveal-delay-1 text-[32px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1d1d1f] dark:text-white">
              Register your salon.
            </h2>
            <p className="reveal reveal-delay-2 text-[15px] text-[#6e6e73] dark:text-[#a1a1a6] mt-4 max-w-[480px] mx-auto">
              Submit your details below. Our team reviews and activates accounts within 24 hours.
            </p>
          </div>

          {submittedData ? (
            <div className="reveal bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/[0.07] rounded-[24px] p-10 text-center animate-fade-in-up">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-[24px] sm:text-[28px] font-bold text-[#1d1d1f] dark:text-white">
                Registration Submitted
              </h3>
              <p className="text-[15px] text-[#6e6e73] dark:text-[#a1a1a6] mt-3 max-w-md mx-auto">
                Thank you, <span className="text-[#1d1d1f] dark:text-white font-semibold">{submittedData.ownerName}</span>. Your salon{" "}
                <span className="font-semibold text-[#1d1d1f] dark:text-white">&ldquo;{submittedData.salonName}&rdquo;</span> is queued for review.
              </p>

              <div className="mt-8 bg-white dark:bg-[#1c1c20] border border-transparent dark:border-white/[0.08] rounded-2xl p-6 text-left max-w-md mx-auto space-y-4 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
                <p className="font-semibold text-[#86868b] dark:text-[#71717a] uppercase tracking-wider text-[11px]">What happens next</p>
                {["Admin verifies your salon details.", "Account approved within 24 hours.", `Log in with ${submittedData.ownerEmail}.`].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#09090b] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={SALON_PANEL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-[#1d1d1f] hover:bg-[#424245] dark:bg-white dark:text-[#09090b] dark:hover:bg-[#e5e5ea] text-white text-[14px] font-semibold rounded-full flex items-center gap-2 transition-all btn-press shadow-md"
                >
                  Go to Salon Panel <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setSalonName(""); setOwnerName(""); setEmail(""); setPhone("");
                    setPassword(""); setConfirmPassword(""); setSalonDescription("");
                  }}
                  className="text-[13px] text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white underline underline-offset-2 py-2 transition-colors cursor-pointer"
                >
                  Submit another registration
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="reveal reveal-delay-2 space-y-5">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 text-[13px] flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "Salon Name", placeholder: "e.g. HairX Salon & Beauty Studio", value: salonName, set: setSalonName, field: "salonName", type: "text" },
                  { label: "Owner Full Name", placeholder: "e.g. Ananya Roy", value: ownerName, set: setOwnerName, field: "ownerName", type: "text" },
                  { label: "Phone Number", placeholder: "+91 98765 43210", value: phone, set: setPhone, field: "phone", type: "tel" },
                  { label: "Email Address", placeholder: "owner@yoursalon.com", value: email, set: setEmail, field: "email", type: "email" },
                  { label: "Password", placeholder: "••••••••", value: password, set: setPassword, field: "password", type: "password" },
                  { label: "Confirm Password", placeholder: "••••••••", value: confirmPassword, set: setConfirmPassword, field: "confirmPassword", type: "password" },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                      {f.label} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => { f.set(e.target.value); setFieldErrs((p) => ({ ...p, [f.field]: "" })); }}
                      className="w-full bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] dark:placeholder-[#71717a] focus:outline-none focus:bg-white dark:focus:bg-[#1c1c20] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all"
                    />
                    {fieldErrs[f.field] && <p className="text-[12px] text-red-500 mt-1.5">{fieldErrs[f.field]}</p>}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">
                  Salon Description <span className="text-[#86868b] dark:text-[#71717a] font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your salon, locations, team size, and services..."
                  value={salonDescription}
                  onChange={(e) => setSalonDescription(e.target.value)}
                  className="w-full bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-[14px] text-[#1d1d1f] dark:text-white placeholder-[#aeaeb2] dark:placeholder-[#71717a] focus:outline-none focus:bg-white dark:focus:bg-[#1c1c20] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all resize-none"
                />
              </div>

              <p className="text-[12px] text-[#86868b] dark:text-[#71717a]">
                Password must be at least 8 characters with 1 uppercase, 1 number & 1 special character.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1d1d1f] hover:bg-[#424245] dark:bg-white dark:text-[#09090b] dark:hover:bg-[#e5e5ea] disabled:opacity-50 text-white font-semibold text-[15px] rounded-full transition-all flex items-center justify-center gap-2 btn-press shadow-lg shadow-black/10 dark:shadow-black/40 cursor-pointer"
              >
                {loading ? "Submitting..." : (<>Submit Registration <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-28 px-6 bg-[#f5f5f7] dark:bg-[#0f0f12] transition-colors duration-250" ref={faqRef}>
        <div className="max-w-[680px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="reveal text-[32px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1d1d1f] dark:text-white">
              Questions?
              <br />
              <span className="text-[#86868b] dark:text-[#71717a]">Answers.</span>
            </h2>
          </div>

          <div className="reveal reveal-delay-1 space-y-0 divide-y divide-[#d2d2d7]/70 dark:divide-white/[0.08] bg-white dark:bg-[#16161a] border border-transparent dark:border-white/[0.07] rounded-[20px] overflow-hidden shadow-sm">
            {[
              {
                q: "Why is my registration held for admin approval?",
                a: "To ensure platform integrity and security, our admin team verifies each new salon before activating the owner account. This typically takes under 24 hours.",
              },
              {
                q: "Can I manage multiple branches under one account?",
                a: "Absolutely. HairX natively supports multi-branch management. Once approved, you can create and manage unlimited branch locations from your single owner panel.",
              },
              {
                q: "How do customer appointments work?",
                a: "Customers use the HairX mobile app to select a branch, pick a service and stylist, and book available time slots in real time. You manage everything from your dashboard.",
              },
              {
                q: "How do staff leaves affect booking slots?",
                a: "When a staff member's leave is approved, their time slots are automatically blocked for that period — preventing any double-booking or scheduling conflicts.",
              },
              {
                q: "Is there a setup fee or monthly subscription?",
                a: "HairX offers free onboarding to get you started. Our pricing plans are designed to scale with your business — you can explore options once your account is activated.",
              },
            ].map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-[#fafafa] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <span className="text-[15px] sm:text-[16px] font-semibold text-[#1d1d1f] dark:text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[#86868b] dark:text-[#71717a] transition-transform duration-300 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="faq-answer px-6 pb-5 text-[14px] sm:text-[15px] text-[#6e6e73] dark:text-[#a1a1a6] leading-relaxed -mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden bg-white dark:bg-[#09090b] transition-colors duration-250" ref={ctaRef}>
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-[#09090b] dark:via-blue-950/20 dark:to-[#09090b] pointer-events-none" />
        <div className="max-w-[600px] mx-auto text-center relative z-10">
          <h2 className="reveal text-[32px] sm:text-[48px] font-bold tracking-[-0.03em] leading-[1.08] text-[#1d1d1f] dark:text-white">
            Ready to transform
            <br />
            your salon?
          </h2>
          <p className="reveal reveal-delay-1 text-[16px] text-[#6e6e73] dark:text-[#a1a1a6] mt-5 leading-relaxed">
            Join hundreds of salon owners who trust HairX to manage their business. Start free today.
          </p>
          <div className="reveal reveal-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#register"
              className="px-8 py-3.5 bg-[#1d1d1f] hover:bg-[#424245] dark:bg-white dark:text-[#09090b] dark:hover:bg-[#e5e5ea] text-white text-[15px] font-semibold rounded-full flex items-center gap-2 transition-all btn-press shadow-lg shadow-black/10 dark:shadow-black/40"
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
      <footer className="border-t border-[#d2d2d7]/50 dark:border-white/10 bg-[#f5f5f7] dark:bg-[#050507] transition-colors duration-250">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="HairX" className="w-6 h-6 rounded object-cover" />
              <span className="font-semibold text-[13px] tracking-tight text-[#1d1d1f] dark:text-white">
                Hair<span className="font-bold">X</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] text-[#6e6e73] dark:text-[#71717a]">
              <a href="#benefits" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Benefits</a>
              <a href="#guide" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">How It Works</a>
              <a href="#roi" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Calculator</a>
              <a href="#register" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Register</a>
              <a href={SALON_PANEL_URL} target="_blank" rel="noreferrer" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Salon Panel</a>
              <a href="/terms" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Terms</a>
              <a href="/privacy-policy" className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Privacy</a>
            </div>

            <p className="text-[11px] text-[#86868b] dark:text-[#52525b]">© 2026 HairX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
