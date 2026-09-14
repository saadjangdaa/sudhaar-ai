import { redirect } from "next/navigation";

/** The landing page is the home page now; this path stays so old links keep working. */
export default function LandingPageRedirect() {
  redirect("/");
}
