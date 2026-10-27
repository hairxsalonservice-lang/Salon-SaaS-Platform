import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/lib/ThemeToggle";

export const metadata = {
  title: "Privacy Policy — HairX Salon Platform",
  description: "Privacy Policy for HairX Salon SaaS Platform",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f]">Privacy Policy</h1>
        <p className="text-[13px] text-[#86868b] mt-3 mb-14">Effective Date: 27 October 2026</p>

        <div className="space-y-10 text-[14px] leading-relaxed text-[#6e6e73]">
          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">1. Introduction</h2>
            <p>
              Hair X Salon (&quot;Hair X,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
              your privacy and ensuring that your personal data is handled responsibly and in compliance
              with the Information Technology Act, 2000, and the Information Technology (Reasonable
              Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011,
              and any applicable data protection legislation.
            </p>
            <p className="mt-3">
              This Privacy Policy (&quot;Policy&quot;) explains how we collect, use, store, share, and protect your
              personal information when you access and use our website, mobile application, and related
              services (collectively, the &quot;Platform&quot;).
            </p>
            <p className="mt-3">
              By using the Platform, you consent to the collection, use, and processing of your personal
              data as described in this Policy. If you do not agree with this Policy, please discontinue use
              of the Platform immediately.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <h3 className="font-medium text-[#1d1d1f] mb-2">a. Personal Information Provided by You:</h3>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-4">
              <li>Full name</li><li>Email address</li><li>Phone number</li><li>Gender</li>
              <li>Date of birth</li><li>Profile photo (optional)</li><li>Location/address</li>
              <li>Appointment preferences (services, staff, time slots)</li>
            </ul>
            <h3 className="font-medium text-[#1d1d1f] mb-2">b. Information Collected Automatically:</h3>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-4">
              <li>Device information (model, OS, browser type)</li><li>IP address</li>
              <li>App usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>
            <h3 className="font-medium text-[#1d1d1f] mb-2">c. Payment Information:</h3>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-4">
              <li>Transaction details processed through third-party payment gateways (e.g., Razorpay)</li>
              <li>We do not store your card or banking details on our servers</li>
            </ul>
            <h3 className="font-medium text-[#1d1d1f] mb-2">d. Salon Partner Information:</h3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Business name and GSTIN</li><li>Staff details (name, role, contact)</li>
              <li>Service menus and pricing</li><li>Working hours and branch information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">3. How We Use Your Personal Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>To facilitate account creation and authentication</li>
              <li>To enable booking and appointment management</li>
              <li>To process and facilitate payments</li>
              <li>To provide customer support</li>
              <li>To send transactional messages (booking confirmations, reminders, cancellations)</li>
              <li>To personalize user experience and service recommendations</li>
              <li>To communicate promotional offers (only with consent)</li>
              <li>To enable salon partners to manage their business, staff, and services</li>
              <li>To analyze usage trends and improve Platform performance</li>
              <li>To detect and prevent fraud, abuse, or unauthorized access</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">4. Sharing of Information</h2>
            <p className="mb-3">We do not sell or rent your personal data to third parties. We may share data in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li><strong className="text-[#1d1d1f]">Salon Partners:</strong> Your name, contact details, and booking preferences are shared with the salon you book with, solely for service fulfillment.</li>
              <li><strong className="text-[#1d1d1f]">Payment Processors:</strong> Payment data is securely shared with third-party gateways (e.g., Razorpay) for transaction processing.</li>
              <li><strong className="text-[#1d1d1f]">Service Providers:</strong> We may engage cloud hosting, analytics, and communication service providers who act as data processors on our behalf.</li>
              <li><strong className="text-[#1d1d1f]">Legal Compliance:</strong> We may disclose your data when required by law, regulation, court order, or government authority.</li>
              <li><strong className="text-[#1d1d1f]">Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your data may be transferred as part of the business.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">5. Payments</h2>
            <p>Hair X uses third-party payment gateways (such as Razorpay) to process payments. We do not collect or store any credit/debit card numbers, CVVs, or banking credentials on our servers. All payment-related data is handled directly by the payment processor under their own terms and privacy policies.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">6. Cookies and Tracking Technologies</h2>
            <p className="mb-3">We may use cookies, local storage, and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-3">
              <li>Maintain user sessions and login state</li>
              <li>Analyze traffic and usage behavior</li>
              <li>Personalize content and service suggestions</li>
            </ul>
            <p>You may manage cookie preferences through your browser settings. Disabling cookies may affect Platform functionality.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">7. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>We retain personal data only for as long as necessary to fulfill the purposes outlined in this Policy, or as required by applicable laws.</li>
              <li>Inactive user accounts may be deleted after a reasonable period of inactivity, subject to prior notice.</li>
              <li>Salon partner data will be retained as long as the partner relationship remains active.</li>
              <li>Upon account deletion, your data will be permanently removed from our active systems, although some data may persist in backups for a limited period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">8. Data Security</h2>
            <p className="mb-3">We take reasonable technical and organizational measures to protect your personal data, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-3">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure password hashing and token-based authentication</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p>Despite these efforts, no system is entirely immune from breaches. In the event of a data breach, we will notify affected users and relevant authorities as required by law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">9. Your Privacy Rights</h2>
            <p className="mb-3">Subject to applicable law, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-1 mb-3">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for marketing communications</li>
              <li>Object to or restrict the processing of your data</li>
            </ul>
            <p>To exercise your rights, please contact us at <a href="mailto:support@hairxsalon.com" className="text-[#0071e3] hover:underline">support@hairxsalon.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">10. Children&apos;s Privacy</h2>
            <p>Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has submitted data through our Platform, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">11. Third-Party Services</h2>
            <p>Our Platform may contain links to or integrations with third-party services (e.g., Google Sign-In, social media platforms, analytics tools). We are not responsible for the privacy practices of these services.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">12. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised &quot;Effective Date.&quot; Continued use of the Platform constitutes acceptance of the revised Policy.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">13. Contact Us & Privacy Complaints</h2>
            <p className="mb-3">For privacy-related queries or complaints:</p>
            <div className="bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-2xl p-5 space-y-2">
              <p><strong className="text-[#1d1d1f] dark:text-white">Company Name:</strong> Hair X Salon</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Email:</strong> <a href="mailto:support@hairxsalon.com" className="text-[#0071e3] hover:underline">support@hairxsalon.com</a></p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Phone:</strong> 9861217447</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Grievance Officer:</strong> Manguli Naik, Proprietor</p>
            </div>
            <p className="mt-4">If you are not satisfied with our response, you may escalate your complaint to the relevant data protection authority or the Cyber Appellate Tribunal under the Information Technology Act, 2000.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">14. Applicable Law</h2>
            <p>This Privacy Policy shall be governed by and construed in accordance with the laws of India. Any disputes arising from this Policy shall be subject to the exclusive jurisdiction of the courts in Jatni, Odisha, India.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#d2d2d7] dark:border-white/10 py-6 px-6 text-center text-[12px] text-[#86868b] dark:text-[#71717a]">
        <p>© 2026 HairX. All rights reserved.</p>
      </footer>
    </div>
  );
}
