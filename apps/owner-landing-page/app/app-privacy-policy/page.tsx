import ThemeToggle from "@/lib/ThemeToggle";

export const metadata = {
  title: "Privacy Policy — HairX Customer App",
  description:
    "Privacy Policy for the Hair X Salon Customer Mobile Application",
};

export default function AppPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-250">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-[#d2d2d7]/60 dark:border-white/10 transition-colors duration-250">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="HairX"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-semibold text-[17px] tracking-tight text-[#1d1d1f] dark:text-white">
              Hair<span className="font-bold">X</span>
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 py-20">
        <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] text-[#1d1d1f] dark:text-white">
          Privacy Policy
        </h1>
        <div className="mt-3 mb-14 space-y-1 text-[13px] text-[#86868b] dark:text-[#a1a1a6]">
          <p>Hair X Salon &mdash; Customer Mobile Application</p>
          <p><strong className="text-[#1d1d1f] dark:text-white">Effective Date:</strong> 4 November 2026</p>
        </div>

        <div className="space-y-10 text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">1. Introduction</h2>
            <p>Hair X Salon respects customer privacy and is committed to protecting personal information collected through its mobile application. This Privacy Policy explains what information we collect, why we collect it, how we use it and when we may share it.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">Depending on the features used, Hair X Salon may collect:</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">A. Personal Information</h3>
            <p className="mb-4">Customer name, mobile number, email address where required, and account registration details.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">B. Booking Information</h3>
            <p className="mb-4">Selected salon, selected service, preferred Barber or professional stylist, appointment date, selected time slot, booking confirmation and history.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">C. Location Information</h3>
            <p className="mb-4">Location information when customers use location-related features, to help discover nearby salons, view addresses and identify salon locations. Customers may manage permissions through device settings; manual location selection may also be available. We do not intend to continuously track customers in the background.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">D. Device Information</h3>
            <p>Device type, operating system, application version, technical logs, errors and diagnostic information.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">3. How We Use Customer Information</h2>
            <p>Customer information may be used for creating and managing accounts; processing appointment requests; managing booking confirmations; sharing booking details with selected salons; providing Barber or professional selection; communicating appointment updates; providing customer support; improving application performance; preventing fraud; and maintaining platform security.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">4. Salon Information and Images</h2>
            <p>Hair X Salon may display salon information provided by Salon Partners, including salon name, salon photographs, salon address and location, contact number, services and descriptions, service prices, and professional information where available. This information helps customers identify salons and make booking decisions.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">5. Sharing Customer Information</h2>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">A. Selected Salon Partner</h3>
            <p className="mb-4">When a customer makes a booking, relevant details may be shared with the selected Salon Partner, including customer name, contact number, selected service, preferred Barber or professional, and appointment date and time. This is for appointment management and customer communication.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">B. Technology Service Providers</h3>
            <p className="mb-4">Necessary information may be shared with authorised providers responsible for application hosting, database management, technical maintenance, customer communication and application security.</p>

            <h3 className="font-medium text-[#1d1d1f] dark:text-white mb-2">C. Legal Requirements</h3>
            <p className="mb-4">Information may be disclosed when required by applicable law or a valid legal request from a competent authority.</p>

            <p>Hair X Salon does not sell customers&apos; personal information as a business activity.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">6. Location Permission</h2>
            <p>Location permission may be requested to provide salon discovery and location-related services. Customers can allow or deny location access through device settings. Where supported, customers may manually enter or select their location.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">7. Payments and Financial Information</h2>
            <p>Online payment facilities are currently unavailable. Customers pay Salon Partners directly at the salon through cash, UPI or other methods accepted by the Salon Partner. Hair X Salon does not currently process online service payments and does not request customers&apos; banking passwords, card PINs or UPI PINs for service payments. In the future, online payment facilities may be introduced through authorised third-party payment gateways. This Privacy Policy will be updated when online payment facilities are introduced.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">8. Salon Product Sales &mdash; Future Feature</h2>
            <p>Salon product sales are currently unavailable. Hair X Salon plans to introduce product sales approximately five months after the initial launch. When this feature is introduced, additional information may be collected where necessary for product purchases, such as customer name, contact details, delivery address, product order details, and payment and transaction information where applicable. Relevant information may be shared with authorised payment providers, delivery partners and other service providers to fulfil product orders. An updated Privacy Policy will be published before the feature becomes operational.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">9. Data Storage and Security</h2>
            <p>Hair X Salon takes reasonable technical and organisational measures to protect customer information against unauthorised access, misuse, loss, alteration and disclosure. Measures may include access controls, password protection, secure infrastructure and restricted administrative access. However, no electronic storage or internet transmission system can be guaranteed to be completely secure.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">10. Data Retention</h2>
            <p>We retain customer information for as long as reasonably necessary for providing platform services, managing customer accounts, maintaining booking records, customer support, legal and regulatory compliance, resolving disputes and preventing fraud. Information will be deleted or anonymised when no longer required, subject to applicable legal obligations.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">11. Customer Privacy Rights</h2>
            <p>Subject to applicable law, customers may request access to their personal information, correction of inaccurate information, deletion of personal information, withdrawal of consent where applicable, and assistance with privacy-related complaints. Customers may contact Hair X Salon using the details below.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">12. Third-Party Services</h2>
            <p>Hair X Salon may use third-party service providers to operate and maintain the application. Such providers may process relevant information for authorised purposes and subject to applicable agreements and legal requirements.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">13. Children&apos;s Privacy</h2>
            <p>Hair X Salon will handle children&apos;s personal data in accordance with applicable Indian laws and required parental or guardian consent and safeguards.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">14. Changes to This Privacy Policy</h2>
            <p>Hair X Salon may update this Privacy Policy when new application features are introduced, salon discovery features are updated, product sales are introduced, online payment facilities become available, new service providers are engaged, or applicable legal requirements change. Updated policies will be published through the application or website.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">15. Contact and Privacy Complaints</h2>
            <p className="mb-3">For privacy-related questions, correction requests, deletion requests or complaints, contact:</p>
            <div className="bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-2xl p-5 space-y-2">
              <p><strong className="text-[#1d1d1f] dark:text-white">Company:</strong> Hair X Salon</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Contact Person:</strong> Manguli Naik</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Mobile:</strong> 9861217447</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Email:</strong>{" "}
                <a href="mailto:hairxsalonservice@gmail.com" className="text-[#0071e3] hover:underline">hairxsalonservice@gmail.com</a>
              </p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Website:</strong> www.hairxsalon.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">16. Applicable Law</h2>
            <p>This Privacy Policy shall be interpreted in accordance with applicable Indian laws, including the Information Technology Act, 2000, applicable rules and the Digital Personal Data Protection Act, 2023, and rules to the extent applicable and in force.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">17. Developer Disclaimer</h2>
            <p>The Platform is developed and maintained by an independent software developer solely as a technology service provider. The developer is not responsible or liable for any illegal, unlawful, fraudulent, or unauthorised activities conducted by any user, Salon Partner, or third party through or in connection with the Platform. The developer does not control, endorse, or guarantee the actions, conduct, or services of any user or Salon Partner. All users are solely responsible for their own compliance with applicable laws. Any legal consequences arising from misuse of the Platform shall be borne entirely by the individual or entity responsible for such misuse, and not by the developer.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#d2d2d7] dark:border-white/10 py-6 px-6 text-center text-[12px] text-[#86868b] dark:text-[#71717a]">
        <p>&copy; 2026 HairX. All rights reserved.</p>
      </footer>
    </div>
  );
}
