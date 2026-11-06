import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "@/lib/ThemeToggle";

export const metadata = {
  title: "Salon Partner Terms & Conditions — HairX Salon Platform",
  description:
    "Salon Partner Terms and Conditions for the Hair X Salon Partner Web Platform",
};

export default function TermsPage() {
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
        <p className="text-[13px] font-semibold tracking-widest uppercase text-[#86868b] dark:text-[#a1a1a6] mb-4">
          Salon Management | Booking | Staff Management | Business Growth
        </p>
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f] dark:text-white">
          Salon Partner<br />Terms &amp; Conditions
        </h1>
        <div className="mt-5 mb-14 space-y-1 text-[13px] text-[#86868b] dark:text-[#a1a1a6]">
          <p><strong className="text-[#1d1d1f] dark:text-white">Effective Date:</strong> 6 November 2026</p>
          <p><strong className="text-[#1d1d1f] dark:text-white">Platform:</strong> Hair X Salon Partner Web</p>
          <p><strong className="text-[#1d1d1f] dark:text-white">Contact Email:</strong>{" "}
            <a href="mailto:hairxsalonservice@gmail.com" className="text-[#0071e3] hover:underline">hairxsalonservice@gmail.com</a>
          </p>
        </div>

        <div className="space-y-10 text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">1. Introduction</h2>
            <p>These Terms and Conditions govern access to and use of the Hair X Salon Partner Web Platform by salon owners, salon operators, managers and their authorised representatives (&quot;Salon Partner&quot;). Hair X Salon provides technology-based tools intended to assist salons with appointment bookings, salon operations, staff management, attendance, leave management, business reporting, customer engagement and business growth activities. By registering for, accessing or using the Platform, the Salon Partner agrees to these Terms and Conditions.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">2. Eligibility and Registration</h2>
            <p>The Salon Partner must provide accurate, complete and up-to-date registration information and must be legally authorised to operate or represent the salon business. The Salon Partner is responsible for maintaining the confidentiality of login credentials and for activity carried out through its account. Any suspected unauthorised access should be reported to Hair X Salon promptly. Hair X Salon may verify registration information and may reject, restrict or suspend registrations containing false, misleading or incomplete information.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">3. Salon Profile and Business Information</h2>
            <p>The Salon Partner may create and manage a salon profile containing the salon name, business details, address, contact information, photographs, descriptions, services, prices, service durations, working hours, available booking slots, branch details and promotional information. The Salon Partner is responsible for ensuring that all information published on the Platform is accurate, lawful, current and not misleading.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">4. Appointment and Booking Management</h2>
            <p>The Platform may allow Salon Partners to receive and manage customer appointments, accept or reject booking requests, view upcoming and completed bookings, manage schedules, monitor booking status, handle cancellations and rescheduling, and view booking history. The Salon Partner is responsible for providing the selected services in accordance with confirmed appointment details and for communicating any changes to customers promptly. Hair X Salon acts as a technology platform and does not itself provide salon or beauty services.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">5. Salon Management System</h2>
            <p>The Platform may provide salon management facilities such as a dashboard, branch management, service and price management, booking and appointment records, customer management, staff management, daily business activity monitoring and business performance information. Features may be updated, modified, added or discontinued from time to time, subject to these Terms and applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">6. Staff Management</h2>
            <p>The Salon Partner may use available tools to add or remove authorised staff members, maintain staff profiles and contact details, assign roles and responsibilities, manage staff availability, allocate appointments and review staff-related operational information. The Salon Partner is responsible for ensuring that staff information is collected and used lawfully and that appropriate notices, permissions or other lawful bases are in place.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">7. Staff Attendance Management</h2>
            <p>The Platform may provide staff check-in and check-out, daily attendance records, attendance history, working-hour records and staff-wise attendance summaries. The Salon Partner is responsible for verifying the accuracy of attendance records and using them appropriately. Hair X Salon is not the employer of the Salon Partner&apos;s employees and does not assume the Salon Partner&apos;s employment-related responsibilities.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">8. Staff Leave Management</h2>
            <p>The Platform may provide leave requests, leave approval or rejection, leave history, leave records and staff availability information. The Salon Partner or its authorised manager is responsible for deciding leave requests and complying with applicable employment laws, contracts and workplace policies. Hair X Salon does not determine employee salaries, employment conditions or leave entitlements.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">9. Salon Services and Pricing</h2>
            <p>The Salon Partner independently determines service prices, descriptions, availability, discounts, promotional offers and service duration. The Salon Partner is responsible for delivering services as advertised, complying with applicable consumer and business laws, and resolving service-related complaints. Hair X Salon does not guarantee the quality of services provided by an individual Salon Partner.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">10. Business Growth and Sales Improvement Tools</h2>
            <p>Hair X Salon aims to support salon visibility, customer engagement and operational efficiency. Depending on availability, the Platform may offer nearby salon visibility, customer discovery and listings, promotional campaigns, advertisements and offers, customer notifications, booking analytics, business performance insights, customer retention tools and marketing opportunities. Hair X Salon does not guarantee any particular number of customers, bookings, revenue, sales or business profits. Results depend on factors including service quality, pricing, location, customer demand and the Salon Partner&apos;s own operations.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">11. Salon Reports and Analytics</h2>
            <p>Depending on available features and recorded data, the Platform may provide daily, weekly and monthly booking summaries; sales and revenue summaries; service-wise performance; staff-wise booking reports; attendance and leave reports; customer and booking history; branch-wise performance; and business activity summaries. Reports are generated from information entered into or recorded through the Platform. The Salon Partner must check the accuracy of entries and maintain its own appropriate financial, tax and accounting records. Platform-generated reports are operational tools and are not audited financial statements, tax returns or legally certified accounts.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">12. Customer Information and Privacy</h2>
            <p>The Salon Partner must handle customer information responsibly and only for legitimate, lawful business purposes. The Salon Partner must not misuse or unlawfully disclose customer information, must take reasonable steps to protect customer records, and must comply with applicable data protection and privacy laws. Hair X Salon will handle personal information in accordance with its applicable Privacy Policy. The Salon Partner should read and comply with that Privacy Policy and any applicable platform instructions.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">13. Salon Partner Responsibilities</h2>
            <p className="mb-3">The Salon Partner agrees to:</p>
            <ul className="list-[lower-alpha] list-inside space-y-1.5 ml-1">
              <li>provide genuine and accurate business information;</li>
              <li>keep salon and service details updated;</li>
              <li>provide services professionally and honour confirmed bookings or promptly communicate changes;</li>
              <li>maintain accurate staff, attendance and leave records;</li>
              <li>protect customer and employee information;</li>
              <li>avoid fraudulent bookings, misleading offers and unlawful conduct;</li>
              <li>comply with applicable business, employment, consumer protection, tax and other laws;</li>
              <li>protect account credentials; and</li>
              <li>not misuse, disrupt, reverse engineer or attempt to compromise the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">14. Hair X Salon Responsibilities</h2>
            <p>Hair X Salon aims to provide access to the Partner Web Platform, make available the booking and salon management features offered under the applicable arrangement, develop staff management and reporting functionality, improve platform security and performance, and provide support through available support channels. Hair X Salon may conduct maintenance, upgrades or technical changes that temporarily affect availability.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">15. Subscription Plans and Future Charges</h2>
            <p>As of the date these Terms are prepared, no online subscription payment facility is being offered through the Platform. Hair X Salon may introduce subscription-based services, premium features, paid plans or platform usage charges in the future. Before a paid plan is activated, the applicable features, price, billing frequency, taxes (if any), renewal terms and cancellation conditions will be communicated to the Salon Partner. No future subscription charge is payable merely because the possibility of future subscriptions is mentioned in these Terms. Any paid subscription will be subject to the terms disclosed for that plan and any legally required consent.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">16. Future Online Payment Integration</h2>
            <p>Online payment facilities are currently not available on the Platform. At present, customers are required to pay the Salon Partner directly at the salon using payment methods accepted by that salon, such as cash or UPI. Hair X Salon may introduce third-party payment gateway integration, including Razorpay or another payment service provider, in the future. Before such facilities are activated, applicable payment terms, transaction charges, settlement arrangements, refunds, disputes and payment-provider conditions will be communicated or made available. Third-party payment services may also be governed by their own terms and policies.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">17. Refunds and Service Disputes</h2>
            <p>Because Hair X Salon does not currently collect online customer payments through the Platform, the Salon Partner is responsible for handling payments received directly from customers and for addressing service-related refund requests in accordance with its disclosed refund policy and applicable law. Any future platform payment and refund arrangements will be governed by additional terms made available when online payment services are introduced.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">18. Account Suspension and Termination</h2>
            <p>Hair X Salon may restrict, suspend or terminate access where it reasonably believes that the Salon Partner has provided false information, used the Platform unlawfully, misused customer or employee information, engaged in fraudulent or abusive activity, materially breached these Terms, or threatened Platform security or integrity. Where reasonably practicable and legally appropriate, Hair X Salon may provide notice and an opportunity to address the issue. A Salon Partner may request account closure by contacting Hair X Salon, subject to outstanding obligations and applicable data retention requirements.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">19. Intellectual Property</h2>
            <p>The Hair X Salon name, brand, logo, Platform design, software, interface, features and associated intellectual property are owned by Hair X Salon or their respective lawful owners. The Salon Partner may use the Platform only for authorised business purposes and must not copy, reproduce, modify, distribute, reverse engineer or commercially exploit Platform materials without prior written permission, except where permitted by law. The Salon Partner remains responsible for ensuring it has the necessary rights and permissions for any names, logos, photographs or other content it uploads.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">20. Limitation of Liability</h2>
            <p>To the extent permitted by applicable law, Hair X Salon is not responsible for independent services provided by Salon Partners, business outcomes or sales generated by a salon, inaccurate information entered by a Salon Partner, or interruptions caused by third-party services, internet connectivity or circumstances beyond its reasonable control. The Platform is provided as a technology and business management service. Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">21. Platform Availability and Updates</h2>
            <p>Hair X Salon may update, modify, add or discontinue Platform features to improve functionality, security or performance. The Platform may occasionally be unavailable due to maintenance, upgrades, technical issues or external circumstances. Hair X Salon will make reasonable efforts to maintain availability but does not guarantee uninterrupted or error-free access.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">22. Changes to Terms and Conditions</h2>
            <p>Hair X Salon may update these Terms from time to time. Updated Terms will be published through the Platform or communicated through appropriate channels, with an effective date where appropriate. Continued use after the effective date may constitute acceptance where legally permitted. Where fresh or express consent is required by law, that consent will be obtained separately.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">23. Governing Law and Jurisdiction</h2>
            <p>These Terms and Conditions are governed by the laws of India. Subject to applicable law and the rules governing territorial and subject-matter jurisdiction, courts of competent jurisdiction in Bhubaneswar, Odisha, shall have jurisdiction over disputes arising from these Terms.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">24. Contact Information</h2>
            <p className="mb-3">For questions, complaints, technical assistance or legal communications, Salon Partners may contact:</p>
            <div className="bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-2xl p-5 space-y-2">
              <p><strong className="text-[#1d1d1f] dark:text-white">Hair X Salon</strong></p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Email:</strong>{" "}
                <a href="mailto:hairxsalonservice@gmail.com" className="text-[#0071e3] hover:underline">hairxsalonservice@gmail.com</a>
              </p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Official Website:</strong>{" "}
                <a href="https://hairxsalon.com" className="text-[#0071e3] hover:underline">hairxsalon.com</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">25. Acceptance of Terms</h2>
            <p>By registering for, logging into, accessing or using the Hair X Salon Partner Web Platform, the Salon Partner confirms that it has read and understood these Terms and Conditions and agrees to be bound by them, subject to applicable law.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#d2d2d7] dark:border-white/10 py-6 px-6 text-center text-[12px] text-[#86868b] dark:text-[#71717a]">
        <p>&copy; 2026 HairX. All rights reserved.</p>
      </footer>
    </div>
  );
}
