import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — HairX Salon Platform",
  description: "Terms and Conditions for HairX Salon SaaS Platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="HairX" className="w-8 h-8 rounded-lg object-cover" />
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-slate-500 mb-12">Effective Date: [Insert Date]</p>

        <div className="space-y-10 text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to Hair X Salon (&quot;Hair X,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These Terms and
              Conditions (&quot;Terms&quot;) govern your access to and use of our website, mobile application, and
              all related services (collectively, the &quot;Platform&quot;).
            </p>
            <p className="mt-3">
              By registering for an account or using the Platform in any manner, you agree to be bound by
              these Terms. If you do not agree with any part of these Terms, you must not use the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Definitions</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong className="text-slate-300">&quot;Customer&quot;</strong> refers to an individual user who books salon services through the Platform.</li>
              <li><strong className="text-slate-300">&quot;Salon Partner&quot;</strong> refers to any business entity that registers on the Platform to offer salon services.</li>
              <li><strong className="text-slate-300">&quot;User&quot;</strong> refers collectively to Customers and Salon Partners.</li>
              <li><strong className="text-slate-300">&quot;Services&quot;</strong> means the booking, salon management, and related features provided through the Platform.</li>
              <li><strong className="text-slate-300">&quot;Content&quot;</strong> refers to text, images, data, and any other material uploaded or displayed on the Platform.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>You must be at least 18 years old to create an account and use the Platform.</li>
              <li>If you are registering as a Salon Partner, you must be authorized to bind the business entity you represent.</li>
              <li>By using the Platform, you represent and warrant that you meet these eligibility requirements.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Account Registration</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are solely responsible for maintaining the confidentiality of your login credentials.</li>
              <li>Any activity under your account is your responsibility.</li>
              <li>We reserve the right to suspend or terminate accounts that contain inaccurate or fraudulent information.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Services Offered</h2>
            <h3 className="font-medium text-slate-200 mb-2">For Customers:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Browse and discover nearby salons and their services</li>
              <li>Book appointments with preferred staff and time slots</li>
              <li>Receive appointment reminders and notifications</li>
              <li>Make online payments</li>
              <li>Leave reviews and ratings</li>
            </ul>
            <h3 className="font-medium text-slate-200 mb-2">For Salon Partners:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Register and manage salon profile and services</li>
              <li>Manage staff, branches, and appointments</li>
              <li>Track attendance and performance</li>
              <li>View business analytics and customer insights</li>
              <li>Access billing and payment features</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Booking and Appointments</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Appointments are confirmed based on availability shown at the time of booking.</li>
              <li>Hair X acts as a facilitator between Customers and Salon Partners. We are not a party to the actual service agreement between them.</li>
              <li>Salon Partners are responsible for delivering the services booked through the Platform.</li>
              <li>Hair X shall not be liable for any deficiency, delay, or quality issues in salon services.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Payments, Pricing &amp; Refunds</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Payments are processed securely through third-party payment gateways (e.g., Razorpay).</li>
              <li>Prices displayed on the Platform are set by the respective Salon Partners and may include applicable taxes.</li>
              <li>Hair X does not guarantee the accuracy of pricing listed by Salon Partners.</li>
              <li>Refunds, if applicable, will be processed as per the Salon Partner&apos;s refund policy or as determined by Hair X in case of disputes.</li>
              <li>Hair X reserves the right to charge a platform fee or commission for facilitating services, which may be disclosed separately.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cancellation Policy</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Customers may cancel or reschedule bookings in accordance with the cancellation policy set by the Salon Partner.</li>
              <li>Late cancellations or no-shows may be subject to a cancellation fee, if applicable.</li>
              <li>Hair X is not liable for cancellations made by Salon Partners.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. User Conduct</h2>
            <p className="mb-3">By using the Platform, you agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Use the Platform for any unlawful or unauthorized purpose</li>
              <li>Interfere with, disrupt, or compromise the integrity of the Platform or its servers</li>
              <li>Post defamatory, abusive, obscene, or objectionable content</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Platform</li>
              <li>Scrape, harvest, or extract data from the Platform without prior written consent</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>All content, designs, logos, trademarks, and software used on the Platform are the exclusive property of Hair X or its licensors.</li>
              <li>Users may not copy, reproduce, distribute, or create derivative works from any part of the Platform without prior written permission.</li>
              <li>Salon Partners retain ownership of the content they upload (e.g., business details, images), but grant Hair X a non-exclusive, worldwide, royalty-free license to display and use such content for Platform operations.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Hair X provides the Platform on an &quot;as-is&quot; and &quot;as-available&quot; basis.</li>
              <li>To the maximum extent permitted by law, Hair X disclaims all warranties, whether express or implied.</li>
              <li>Hair X shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</li>
              <li>Our total liability to you shall not exceed the amount paid by you to Hair X (if any) in the six (6) months preceding the claim.</li>
            </ul>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Hair X, its officers, directors, employees,
              and agents from and against any claims, liabilities, damages, losses, and expenses (including
              legal fees) arising out of or in any way connected with your access to or use of the Platform,
              your violation of these Terms, or your infringement of any rights of another party.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Termination</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Hair X reserves the right to suspend or terminate your access to the Platform at any time, with or without cause, and with or without notice.</li>
              <li>You may deactivate your account at any time by contacting our support team.</li>
              <li>Upon termination, all provisions of these Terms that by their nature should survive will remain in effect (e.g., intellectual property, limitation of liability, indemnification).</li>
            </ul>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any
              disputes arising out of or relating to these Terms or the use of the Platform shall be subject to
              the exclusive jurisdiction of the courts of [Insert City], India.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">15. Amendments</h2>
            <p>
              Hair X reserves the right to modify or update these Terms at any time. Users will be notified
              of material changes via email or a notification on the Platform. Continued use of the Platform
              after any such changes shall constitute your consent to such changes.
            </p>
          </section>

          {/* Section 16 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">16. Severability</h2>
            <p>
              If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions
              shall continue in full force and effect.
            </p>
          </section>

          {/* Section 17 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">17. Contact Information</h2>
            <p className="mb-3">For any queries, concerns, or grievances, please reach out to us:</p>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-2 text-slate-400">
              <p><strong className="text-slate-300">Entity Name:</strong> Hair X Salon</p>
              <p><strong className="text-slate-300">Address:</strong> [Insert business address]</p>
              <p>
                <strong className="text-slate-300">Email:</strong>{" "}
                <a href="mailto:support@hairxsalon.com" className="text-indigo-400 hover:underline">
                  support@hairxsalon.com
                </a>
              </p>
              <p><strong className="text-slate-300">Phone:</strong> [Insert official contact number]</p>
              <p><strong className="text-slate-300">Grievance Officer:</strong> [Insert name and designation]</p>
            </div>
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
