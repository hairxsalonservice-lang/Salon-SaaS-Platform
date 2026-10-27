import { Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — HairX Salon Platform",
  description: "Privacy Policy for HairX Salon SaaS Platform",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              HAIR<span className="text-indigo-400">X</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-12">Last updated: October 27, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              HairX Salon Platform (&quot;HairX&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website{" "}
              <span className="text-indigo-400">hairxsalon.com</span>, the salon partner panel at{" "}
              <span className="text-indigo-400">app.hairxsalon.com</span>, and the HairX mobile application
              (collectively, the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="font-medium text-slate-200 mb-2">Personal Information</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Name, email address, phone number, and gender</li>
              <li>Salon business details (name, address, branch locations)</li>
              <li>Staff information (name, email, phone, role, branch assignment)</li>
              <li>Appointment and booking history</li>
              <li>Payment and billing information</li>
            </ul>

            <h3 className="font-medium text-slate-200 mt-4 mb-2">Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Device type, operating system, and browser information</li>
              <li>IP address and approximate location</li>
              <li>Usage data (pages visited, features used, timestamps)</li>
              <li>Push notification tokens (if notifications are enabled)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>To provide and maintain our Service, including appointment booking and salon management</li>
              <li>To process salon registrations and manage multi-branch operations</li>
              <li>To facilitate staff management, scheduling, and attendance tracking</li>
              <li>To send transactional notifications (booking confirmations, reminders, status updates)</li>
              <li>To generate reports and analytics for salon owners and managers</li>
              <li>To improve our Service and develop new features</li>
              <li>To respond to customer support requests</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing and Disclosure</h2>
            <p className="mb-3">We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li><strong className="text-slate-300">Salon Partners:</strong> Customer booking details are shared with the salon you book with</li>
              <li><strong className="text-slate-300">Service Providers:</strong> Hosting, email delivery, and analytics providers that help us operate the platform</li>
              <li><strong className="text-slate-300">Legal Requirements:</strong> When required by law, regulation, or legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encrypted
              data transmission (HTTPS/TLS), secure password hashing, JWT-based authentication with
              token versioning, and role-based access control (RBAC) for multi-tenant data isolation.
              However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to
              provide our Service. Salon business data, appointment history, and staff records are retained
              as long as the salon account remains active. You may request deletion of your account and
              associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal data</li>
              <li>Withdraw consent for data processing</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability where technically feasible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cookies and Tracking</h2>
            <p>
              We use essential cookies and local storage to maintain your session, remember your
              preferences, and keep you logged in. We do not use third-party advertising cookies.
              Analytics data is collected in aggregate to improve the platform experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Third-Party Services</h2>
            <p>
              Our Service may contain links to third-party websites or integrate with third-party services
              (such as Google Sign-In and Apple Sign-In). We are not responsible for the privacy practices
              of these third parties. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              Our Service is not directed to individuals under the age of 13. We do not knowingly collect
              personal information from children. If you become aware that a child has provided us with
              personal data, please contact us so we can take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page
              with an updated &quot;Last updated&quot; date. Continued use of the Service after changes
              constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:support@hairxsalon.com" className="text-indigo-400 hover:underline">
                support@hairxsalon.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 bg-[#070a11] border-t border-slate-800/80 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto text-center">
          <p>&copy; 2026 HAIRX SALON PLATFORM. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
