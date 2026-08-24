import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { OfferPopup } from "@/modules/offer/OfferPopup";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
      {/* Marketing pages only — never over the diagnostic, the portal, or admin.
          Fetches its own rules on idle, so these pages stay statically rendered. */}
      <OfferPopup />
    </>
  );
}
