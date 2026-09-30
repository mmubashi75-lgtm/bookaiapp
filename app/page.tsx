import { redirect } from "next/navigation";

// Single entry: full BookAI app lives in public/bookai.html
export default function HomePage() {
  redirect("/bookai.html");
}
