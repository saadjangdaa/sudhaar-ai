import { redirect } from "next/navigation";

/** The feed is the home page now; this path stays so old links keep working. */
export default function FeedPage() {
  redirect("/");
}
