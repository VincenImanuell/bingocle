import { redirect } from "next/navigation";
import { href, HOME_SLUG } from "@/lib/nav";

export default function Home() {
  redirect(href(HOME_SLUG));
}
