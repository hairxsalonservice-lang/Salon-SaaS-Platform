import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/lib/ThemeToggle";

export const metadata = {
  title: "Privacy Policy — HairX Salon Platform",
  description: "Privacy Policy for Hair X Salon Platform",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-250">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-[#d2d2d7]/60 dark:border-white/10 transition-colors duration-250">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="HairX"
              className="w-8 h-8 rounded-lg object-cover"
            />
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
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f] dark:text-white">
          Privacy Policy
        </h1>
        <div className="mt-3 mb-14 space-y-1 text-[13px] text-[#86868b] dark:text-[#a1a1a6]">
          <p>Hair X Salon | hairxsalon.com</p>
          <p><strong className="text-[#1d1d1f] dark:text-white">Last Updated:</strong> 31 October 2026</p>
        </div>

        <div className="space-y-10 text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">1. Introduction</h2>
            <p>Hair X Salon (&quot;Hair X&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and ensuring that your personal data is handled responsibly in compliance with applicable Indian laws, including the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, to the extent applicable.</p>
            <p className="mt-3">This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you access and use our website, mobile application, and related services (collectively, the &quot;Platform&quot;).</p>
            <p className="mt-3">By using the Platform, you acknowledge that your information may be handled as described in this Policy. Where consent is required by applicable law, we will seek it. If you do not agree with this Policy, please discontinue use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">a. Personal Information Provided by You:</h3>
            <p className="mb-4">Full name; email address; phone number; gender (if provided); date of birth (if provided); profile photo (optional); location/address; and appointment preferences, including services, staff, and time slots.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">b. Information Collected Automatically:</h3>
            <p className="mb-4">Device information (such as device model and operating system); browser type; IP address; app usage data (such as pages visited, features used, and time spent); and cookies or similar tracking technologies, as described in Section 6.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">c. Payment Information:</h3>
            <p className="mb-4">Hair X Salon does not currently collect or process customers&apos; online payment details through the Platform. Customers pay the respective Salon Partner directly at the salon, such as by cash or UPI. Any payment information provided directly to a Salon Partner is handled by that Salon Partner and/or the relevant payment service provider.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">d. Salon Partner Information:</h3>
            <p>Business name and GSTIN (where provided); staff details (such as name, role, and contact details); service menus and pricing; and working hours and branch information.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">3. How We Use Your Personal Information</h2>
            <p className="mb-3">We may use your personal information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>To facilitate account creation and authentication.</li>
              <li>To enable booking and appointment management.</li>
              <li>To provide customer support.</li>
              <li>To send transactional messages, such as booking confirmations, reminders, and cancellation updates.</li>
              <li>To personalise the user experience and service recommendations.</li>
              <li>To communicate promotional offers, where you have provided the required consent.</li>
              <li>To enable Salon Partners to manage their business, staff, and services.</li>
              <li>To analyse usage trends and improve Platform performance.</li>
              <li>To detect and prevent fraud, abuse, or unauthorised access.</li>
              <li>To comply with applicable legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">4. Sharing of Information</h2>
            <p className="mb-3">We do not sell or rent your personal data to third parties. We may share information only where necessary for the purposes described in this Policy, including in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li><strong className="text-[#1d1d1f] dark:text-white">Salon Partners:</strong> Your name, contact details, and booking preferences may be shared with the Salon Partner you book with, solely to fulfil your appointment.</li>
              <li><strong className="text-[#1d1d1f] dark:text-white">Service Providers:</strong> We may engage cloud hosting, analytics, and communication service providers who act as service providers or data processors on our behalf.</li>
              <li><strong className="text-[#1d1d1f] dark:text-white">Legal Compliance:</strong> We may disclose your data where required by applicable law, regulation, court order, or governmental authority.</li>
              <li><strong className="text-[#1d1d1f] dark:text-white">Business Transfers:</strong> In the event of a merger, acquisition, restructuring, or asset sale, your data may be transferred as part of the business, subject to applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">5. Payments</h2>
            <p className="mb-3"><strong className="text-[#1d1d1f] dark:text-white">Online payment facilities are currently not available</strong> on the Hair X Salon Platform. Customers must make payments directly to the respective Salon Partner at the salon, through cash or UPI, as accepted by that Salon Partner.</p>
            <p className="mb-3">Hair X Salon does not currently collect, receive, or process customers&apos; online payments through the Platform and does not store customers&apos; card, bank account, UPI PIN, or other online payment credentials.</p>
            <p>Online payment facilities may be introduced in the future through third-party payment gateway providers. If and when these facilities are introduced, this Privacy Policy will be updated to explain the relevant payment processing, information sharing, and security arrangements before or when the feature becomes available.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">6. Cookies and Tracking Technologies</h2>
            <p className="mb-3">We may use cookies, local storage, and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 mb-3">
              <li>Maintain user sessions and login state.</li>
              <li>Analyse traffic and usage behaviour.</li>
              <li>Personalise content and service suggestions.</li>
            </ul>
            <p>You may manage cookie preferences through your browser settings. Disabling cookies may affect Platform functionality.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">7. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2 ml-1">
              <li>We retain personal data only for as long as necessary to fulfil the purposes outlined in this Policy, or as required by applicable law.</li>
              <li>Inactive user accounts may be deleted after a reasonable period of inactivity, subject to prior notice where practicable.</li>
              <li>Salon Partner data will be retained for as long as the partner relationship remains active, or as otherwise required by law.</li>
              <li>Upon account deletion, your data will be removed from our active systems within a reasonable period, subject to legal retention requirements. Some data may remain in backups for a limited period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">8. Data Security</h2>
            <p className="mb-3">We take reasonable technical and organisational measures to protect your personal data, including:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 mb-3">
              <li>Encryption of data in transit (HTTPS/TLS), where supported.</li>
              <li>Secure password hashing and token-based authentication, where implemented.</li>
              <li>Role-based access controls.</li>
              <li>Regular security reviews and updates.</li>
            </ul>
            <p>Despite these efforts, no system is entirely immune from security incidents. In the event of a personal data breach, we will take appropriate steps and provide notices to affected users and relevant authorities where required by applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">9. Your Privacy Rights</h2>
            <p className="mb-3">Subject to applicable law and the circumstances of processing, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1 mb-3">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your account and personal data, subject to legal retention requirements.</li>
              <li>Withdraw consent for marketing communications.</li>
              <li>Raise an objection or request restriction where such rights are available under applicable law.</li>
            </ul>
            <p>To exercise your rights or raise a privacy-related concern, please contact us at{" "}
              <a href="mailto:hairxsalonservice@gmail.com" className="text-[#0071e3] hover:underline">hairxsalonservice@gmail.com</a>.
              We will respond within the period required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal data from children through the Platform. If you believe that a child has provided personal data to us, please contact us so that we can take appropriate action in accordance with applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">11. Third-Party Services</h2>
            <p>The Platform may contain links to or integrations with third-party services (for example, Google Sign-In, social media platforms, or analytics tools). We are not responsible for the privacy practices of those third parties. Please review their respective privacy policies before using their services.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">12. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised &quot;Last Updated&quot; date. Where required by applicable law, we will provide additional notice or obtain consent for material changes. Your continued use of the Platform after an update does not override any consent requirements under applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">13. Contact Us &amp; Privacy Complaints</h2>
            <p className="mb-3">For privacy-related questions, requests, or complaints, please contact:</p>
            <div className="bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-2xl p-5 space-y-2">
              <p><strong className="text-[#1d1d1f] dark:text-white">Company Name:</strong> Hair X Salon</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Email:</strong>{" "}
                <a href="mailto:hairxsalonservice@gmail.com" className="text-[#0071e3] hover:underline">hairxsalonservice@gmail.com</a>
              </p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Grievance Officer:</strong> Manguli Naik, Proprietor</p>
            </div>
            <p className="mt-4">If you are not satisfied with our response, you may pursue the remedies available under applicable Indian law before the appropriate authority or forum.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">14. Applicable Law</h2>
            <p>This Privacy Policy shall be governed by and construed in accordance with the laws of India. Subject to applicable law, disputes arising from this Policy shall be subject to the jurisdiction of the competent courts at Jatni, Odisha, India.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#d2d2d7] dark:border-white/10 py-6 px-6 text-center text-[12px] text-[#86868b] dark:text-[#71717a]">
        <p>&copy; 2026 HairX. All rights reserved.</p>
      </footer>
    </div>
  );
}
