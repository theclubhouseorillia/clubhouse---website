import { permanentRedirect } from "next/navigation";

// Kids' birthday parties are now a package on the Private Events page.
export default function KidsPartiesPage() {
  permanentRedirect(`/private-events?package=${encodeURIComponent("Kids' Birthday Party")}#inquire`);
}
