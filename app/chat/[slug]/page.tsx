import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolved = await Promise.resolve(params);
  const slug = resolved.slug;
  redirect(`/bookai.html?slug=${encodeURIComponent(slug)}`);
}
