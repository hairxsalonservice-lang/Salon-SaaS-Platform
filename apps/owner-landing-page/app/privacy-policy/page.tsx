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
        <p className="text-sm text-slate-500 mb-12">Effective Date: [Insert Date]</p>

        <div className="space-y-10 text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
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

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>

            <h3 className="font-medium text-slate-200 mb-2">a. Personal Information Provided by You:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Gender</li>
              <li>Date of birth</li>
              <li>Profile photo (optional)</li>
              <li>Location/address</li>
              <li>Appointment preferences (services, staff, time slots)</li>
            </ul>

            <h3 className="font-medium text-slate-200 mb-2">b. Information Collected Automatically:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Device information (model, OS, browser type)</li>
              <li>IP address</li>
              <li>App usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>

            <h3 className="font-medium text-slate-200 mb-2">c. Payment Information:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Transaction details processed through third-party payment gateways (e.g., Razorpay)</li>
              <li>We do not store your card or banking details on our servers</li>
            </ul>

            <h3 className="font-medium text-slate-200 mb-2">d. Salon Partner Information:</h3>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Business name and GSTIN</li>
              <li>Staff details (name, role, contact)</li>
              <li>Service menus and pricing</li>
              <li>Working hours and branch information</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Personal Information</h2>
            <p className="mb-3">We use your data for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
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

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Sharing of Information</h2>
            <p className="mb-3">We do not sell or rent your personal data to third parties. We may share data in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>
                <strong className="text-slate-300">Salon Partners:</strong> Your name, contact details, and booking preferences
                are shared with the salon you book with, solely for service fulfillment.
              </li>
              <li>
                <strong className="text-slate-300">Payment Processors:</strong> Payment data is securely shared with
                third-party gateways (e.g., Razorpay) for transaction processing.
              </li>
              <li>
                <strong className="text-slate-300">Service Providers:</strong> We may engage cloud hosting, analytics,
                and communication service providers who act as data processors on our behalf.
              </li>
              <li>
                <strong className="text-slate-300">Legal Compliance:</strong> We may disclose your data when required by
                law, regulation, court order, or government authority.
              </li>
              <li>
                <strong className="text-slate-300">Business Transfers:</strong> In the event of a merger, acquisition, or
                asset sale, your data may be transferred as part of the business.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Payments</h2>
            <p>
              Hair X uses third-party payment gateways (such as Razorpay) to process payments. We do not
              collect or store any credit/debit card numbers, CVVs, or banking credentials on our servers. All
              payment-related data is handled directly by the payment processor under their own terms and
              privacy policies. We encourage you to review Razorpay&apos;s privacy policy before making
              transactions.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Cookies and Tracking Technologies</h2>
            <p className="mb-3">We may use cookies, local storage, and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Maintain user sessions and login state</li>
              <li>Analyze traffic and usage behavior</li>
              <li>Personalize content and service suggestions</li>
            </ul>
            <p>
              You may manage cookie preferences through your browser settings. Disabling cookies may
              affect Platform functionality.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>We retain personal data only for as long as necessary to fulfill the purposes outlined in this Policy, or as required by applicable laws.</li>
              <li>Inactive user accounts may be deleted after a reasonable period of inactivity, subject to prior notice.</li>
              <li>Salon partner data will be retained as long as the partner relationship remains active.</li>
              <li>Upon account deletion, your data will be permanently removed from our active systems, although some data may persist in backups for a limited period.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Data Security</h2>
            <p className="mb-3">
              We take reasonable technical and organizational measures to protect your personal data, including:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure password hashing and token-based authentication</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p>
              Despite these efforts, no system is entirely immune from breaches. In the event of a data
              breach, we will notify affected users and relevant authorities as required by law.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Your Privacy Rights</h2>
            <p className="mb-3">Subject to applicable law, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2 mb-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for marketing communications</li>
              <li>Object to or restrict the processing of your data</li>
            </ul>
            <p>
              To exercise your rights, please contact us at{" "}
              <a href="mailto:support@hairxsalon.com" className="text-indigo-400 hover:underline">
                support@hairxsalon.com
              </a>.
              We will respond within a reasonable timeframe, and no later than 30 days.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              Our Platform is not intended for individuals under the age of 18. We do not knowingly collect
              personal data from minors. If you believe a minor has submitted data through our Platform,
              please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Third-Party Services</h2>
            <p>
              Our Platform may contain links to or integrations with third-party services (e.g., Google Sign-In,
              social media platforms, analytics tools). We are not responsible for the privacy practices of
              these services, and we recommend reviewing their privacy policies before sharing your data.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page
              with a revised &quot;Effective Date.&quot; Continued use of the Platform after such changes
              constitutes your acceptance of the revised Policy.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Contact Us & Privacy Complaints</h2>
            <p className="mb-3">For privacy-related queries or complaints, you may reach us at:</p>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-2 text-slate-400">
              <p><strong className="text-slate-300">Company Name:</strong> Hair X Salon</p>
              <p>
                <strong className="text-slate-300">Email:</strong>{" "}
                <a href="mailto:support@hairxsalon.com" className="text-indigo-400 hover:underline">
                  support@hairxsalon.com
                </a>
              </p>
              <p><strong className="text-slate-300">Phone:</strong> [Insert official contact number]</p>
              <p><strong className="text-slate-300">Grievance Officer:</strong> [Insert name and designation]</p>
            </div>
            <p className="mt-4">
              If you are not satisfied with our response, you may escalate your complaint to the relevant
              data protection authority or the Cyber Appellate Tribunal under the Information Technology
              Act, 2000.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">14. Applicable Law</h2>
            <p>
              This Privacy Policy shall be governed by and construed in accordance with the laws of India.
              Any disputes arising from this Policy shall be subject to the exclusive jurisdiction of the courts
              in [Insert City], India.
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
