import ThemeToggle from "@/lib/ThemeToggle";

export const metadata = {
  title: "Terms & Conditions — HairX Customer App",
  description:
    "Terms and Conditions for the Hair X Salon Customer Mobile Application",
};

export default function AppTermsPage() {
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
          Terms &amp; Conditions
        </h1>
        <div className="mt-3 mb-14 space-y-1 text-[13px] text-[#86868b] dark:text-[#a1a1a6]">
          <p>Hair X Salon &mdash; Customer Mobile Application</p>
          <p><strong className="text-[#1d1d1f] dark:text-white">Effective Date:</strong> 4 November 2026</p>
        </div>

        <div className="space-y-10 text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">1. Introduction</h2>
            <p>Welcome to Hair X Salon. These Terms &amp; Conditions govern your use of the Hair X Salon mobile application and its services. By registering or using the application, you agree to these Terms &amp; Conditions.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">2. Services Provided</h2>
            <p>Hair X Salon is a salon discovery and appointment-booking platform connecting customers with salon businesses and professionals. The application provides salon listing and discovery; salon photographs and business information; salon address, location and contact number; service details and price listings; selection of a preferred Barber or professional stylist; appointment date and available time-slot selection; online appointment booking; and booking confirmation and status information.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">3. Salon Listing</h2>
            <p>Customers can browse salons listed on Hair X Salon and view available information, including salon name and photographs, salon address and location, contact number, available services, service prices, and professional Barber or stylist details where available. Salon information and service prices are provided or updated by the respective Salon Partners.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">4. Appointment Booking</h2>
            <p>Customers can book appointments by selecting a preferred salon, desired service, preferred Barber or professional stylist where available, appointment date and available time slot. A booking will be treated as confirmed only after confirmation through the application or an authorised booking communication. Availability depends on the Salon Partner&apos;s working hours, staff availability and booking schedule.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">5. Barber and Professional Selection</h2>
            <p>Customers may select their preferred Barber or professional stylist from the available options. The selected professional&apos;s availability is subject to confirmation by the Salon Partner. If the selected professional becomes unavailable, the Salon Partner may contact the customer to arrange an alternative.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">6. Salon Information and Pricing</h2>
            <p>Salon names, photographs, locations, contact numbers, services and prices may be provided by Salon Partners. Salon Partners are responsible for maintaining accurate and updated information. The final service price should be verified with the Salon Partner before the service is provided.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">7. Salon Product Sales &mdash; Future Feature</h2>
            <p>The salon product sales feature is currently unavailable. Hair X Salon plans to introduce salon-related product sales approximately five months after the initial launch, subject to development and operational readiness. When introduced, customers may be able to browse and purchase eligible products through the application. Separate terms, delivery, cancellation, return and payment conditions may apply. Hair X Salon does not guarantee a specific launch date.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">8. Payments</h2>
            <p>Online payment facilities are currently unavailable. Customers must pay the respective Salon Partner directly at the salon using cash, UPI or another payment method accepted by the Salon Partner. Hair X Salon currently does not collect online service payments through the application. Online payment facilities may be introduced in the future through authorised third-party payment gateways. Additional terms will apply when introduced.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">9. Cancellation and Rescheduling</h2>
            <p>Customers should cancel or reschedule appointments as early as possible. Cancellation, late arrival, rescheduling and no-show policies may depend on the respective Salon Partner. Hair X Salon may assist customers with booking-related complaints. Payments made directly to Salon Partners are subject to the applicable Salon Partner refund policy and applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">10. Customer Responsibilities</h2>
            <p>Customers agree to provide accurate personal and booking information; avoid fake or fraudulent bookings; respect Salon Partners and their employees; arrive at the scheduled appointment time; keep account credentials and OTPs confidential; and avoid misuse of the application.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">11. Salon Partner Responsibilities</h2>
            <p>Salon Partners are responsible for providing salon services, maintaining service quality and hygiene, updating service prices, managing professional availability, providing accurate salon information, and honouring confirmed bookings or informing customers about changes.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">12. Platform Availability</h2>
            <p>Hair X Salon will make reasonable efforts to maintain application availability. Temporary interruptions may occur due to maintenance, technical problems or circumstances beyond our reasonable control.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">13. Limitation of Liability</h2>
            <p>Hair X Salon acts as a technology platform connecting customers and Salon Partners. To the extent permitted by law, Hair X Salon is not responsible for independent service-quality issues, inaccurate information supplied by Salon Partners or disputes arising directly between customers and Salon Partners. Nothing in these Terms excludes liability that cannot legally be excluded under applicable law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">14. Intellectual Property</h2>
            <p>The Hair X Salon name, logo, branding, software, application design and original content are protected by applicable intellectual property laws. Unauthorised copying, reproduction or commercial use is prohibited.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">15. Account Suspension and Deletion</h2>
            <p>Hair X Salon may restrict or suspend accounts involved in fraud, misuse or violations of these Terms. Customers may request account deletion by contacting Hair X Salon.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">16. Changes to Terms</h2>
            <p>Hair X Salon may modify these Terms when new features, services, product sales or online payment facilities are introduced. Updated Terms will be published through the application or website.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">17. Governing Law</h2>
            <p>These Terms shall be governed by the applicable laws of India. Subject to applicable law, courts of competent jurisdiction in Bhubaneswar, Odisha, India shall have jurisdiction over relevant disputes.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">18. Contact Information</h2>
            <div className="bg-[#f5f5f7] dark:bg-[#16161a] border border-transparent dark:border-white/10 rounded-2xl p-5 space-y-2">
              <p><strong className="text-[#1d1d1f] dark:text-white">Company:</strong> Hair X Salon</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Contact Person:</strong> Manguli Naik</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Mobile:</strong> 9861217447</p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Email:</strong>{" "}
                <a href="mailto:hairxsalonservice@gmail.com" className="text-[#0071e3] hover:underline">hairxsalonservice@gmail.com</a>
              </p>
              <p><strong className="text-[#1d1d1f] dark:text-white">Website:</strong> www.hairxsalon.com</p>
            </div>
            <p className="mt-4">By using Hair X Salon, you acknowledge that you have read and understood these Terms &amp; Conditions.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-3">19. Developer Disclaimer</h2>
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
