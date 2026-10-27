import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/lib/ThemeToggle";

export const metadata = {
  title: "Terms & Conditions — HairX Salon Platform",
  description: "Terms and Conditions for HairX Salon SaaS Platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-250">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-[#d2d2d7]/60 dark:border-white/10 transition-colors duration-250">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="HairX" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-semibold text-[17px] tracking-tight text-[#1d1d1f] dark:text-white">
              Hair<span className="font-bold">X</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#6e6e73] dark:text-[#a1a1a6] hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 py-20">
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">Terms &amp; Conditions</h1>
        <p className="text-[13px] text-[#86868b] mt-3 mb-14">Effective Date: 27 October 2026</p>

        <div className="space-y-10 text-[14px] leading-relaxed text-[#6e6e73]">
          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">1. Introduction</h2>
            <p>Welcome to Hair X Salon (&quot;Hair X,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of our website, mobile application, and all related services (collectively, the &quot;Platform&quot;).</p>
            <p className="mt-3">By registering for an account or using the Platform in any manner, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">2. Definitions</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li><strong className="text-[#1d1d1f]">&quot;Customer&quot;</strong> refers to an individual user who books salon services through the Platform.</li>
              <li><strong className="text-[#1d1d1f]">&quot;Salon Partner&quot;</strong> refers to any business entity that registers on the Platform to offer salon services.</li>
              <li><strong className="text-[#1d1d1f]">&quot;User&quot;</strong> refers collectively to Customers and Salon Partners.</li>
              <li><strong className="text-[#1d1d1f]">&quot;Services&quot;</strong> means the booking, salon management, and related features provided through the Platform.</li>
              <li><strong className="text-[#1d1d1f]">&quot;Content&quot;</strong> refers to text, images, data, and any other material uploaded or displayed on the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>You must be at least 18 years old to create an account and use the Platform.</li>
              <li>If you are registering as a Salon Partner, you must be authorized to bind the business entity you represent.</li>
              <li>By using the Platform, you represent and warrant that you meet these eligibility requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">4. Account Registration</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>You are solely responsible for maintaining the confidentiality of your login credentials.</li>
              <li>Any activity under your account is your responsibility.</li>
              <li>We reserve the right to suspend or terminate accounts that contain inaccurate or fraudulent information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">5. Services Offered</h2>
            <h3 className="font-medium text-[#1d1d1f] mb-2">For Customers:</h3>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-4">
              <li>Browse and discover nearby salons and their services</li>
              <li>Book appointments with preferred staff and time slots</li>
              <li>Receive appointment reminders and notifications</li>
              <li>Make online payments</li>
              <li>Leave reviews and ratings</li>
            </ul>
            <h3 className="font-medium text-[#1d1d1f] mb-2">For Salon Partners:</h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Register and manage salon profile and services</li>
              <li>Manage staff, branches, and appointments</li>
              <li>Track attendance and performance</li>
              <li>View business analytics and customer insights</li>
              <li>Access billing and payment features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">6. Booking and Appointments</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Appointments are confirmed based on availability shown at the time of booking.</li>
              <li>Hair X acts as a facilitator between Customers and Salon Partners. We are not a party to the actual service agreement between them.</li>
              <li>Salon Partners are responsible for delivering the services booked through the Platform.</li>
              <li>Hair X shall not be liable for any deficiency, delay, or quality issues in salon services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">7. Payments, Pricing &amp; Refunds</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Payments are processed securely through third-party payment gateways (e.g., Razorpay).</li>
              <li>Prices displayed on the Platform are set by the respective Salon Partners and may include applicable taxes.</li>
              <li>Hair X does not guarantee the accuracy of pricing listed by Salon Partners.</li>
              <li>Refunds, if applicable, will be processed as per the Salon Partner&apos;s refund policy or as determined by Hair X in case of disputes.</li>
              <li>Hair X reserves the right to charge a platform fee or commission for facilitating services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">8. Cancellation Policy</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Customers may cancel or reschedule bookings in accordance with the cancellation policy set by the Salon Partner.</li>
              <li>Late cancellations or no-shows may be subject to a cancellation fee, if applicable.</li>
              <li>Hair X is not liable for cancellations made by Salon Partners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">9. User Conduct</h2>
            <p className="mb-3">By using the Platform, you agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Use the Platform for any unlawful or unauthorized purpose</li>
              <li>Interfere with, disrupt, or compromise the integrity of the Platform or its servers</li>
              <li>Post defamatory, abusive, obscene, or objectionable content</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Platform</li>
              <li>Scrape, harvest, or extract data from the Platform without prior written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">10. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>All content, designs, logos, trademarks, and software used on the Platform are the exclusive property of Hair X or its licensors.</li>
              <li>Users may not copy, reproduce, distribute, or create derivative works from any part of the Platform without prior written permission.</li>
              <li>Salon Partners retain ownership of the content they upload but grant Hair X a non-exclusive, worldwide, royalty-free license to display and use such content for Platform operations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">11. Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Hair X provides the Platform on an &quot;as-is&quot; and &quot;as-available&quot; basis.</li>
              <li>To the maximum extent permitted by law, Hair X disclaims all warranties, whether express or implied.</li>
              <li>Hair X shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</li>
              <li>Our total liability shall not exceed the amount paid by you to Hair X in the six (6) months preceding the claim.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">12. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Hair X, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or connected with your use of the Platform, your violation of these Terms, or your infringement of any rights of another party.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">13. Termination</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Hair X reserves the right to suspend or terminate your access at any time, with or without cause.</li>
              <li>You may deactivate your account at any time by contacting our support team.</li>
              <li>Upon termination, all provisions that by their nature should survive will remain in effect.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">14. Governing Law &amp; Jurisdiction</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Jatni, Odisha, India.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">15. Amendments</h2>
            <p>Hair X reserves the right to modify or update these Terms at any time. Users will be notified of material changes via email or a notification on the Platform. Continued use constitutes consent to such changes.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">16. Severability</h2>
            <p>If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">17. Contact Information</h2>
            <p className="mb-3">For any queries, concerns, or grievances:</p>
            <div className="bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-2xl p-5 space-y-2">
              <p><strong className="text-[#1d1d1f] dark:text-white">Entity Name:</strong> Hair X Salon</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Address:</strong> Biswanath Colony, Jatni - 752050, India</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Email:</strong> <a href="mailto:support@hairxsalon.com" className="text-[#0071e3] hover:underline">support@hairxsalon.com</a></p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Phone:</strong> 9861217447</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Grievance Officer:</strong> Manguli Naik, Proprietor</p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#d2d2d7] dark:border-white/10 py-6 px-6 text-center text-[12px] text-[#86868b] dark:text-[#71717a]">
        <p>© 2026 HairX. All rights reserved.</p>
      </footer>
    </div>
  );
}
