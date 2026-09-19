import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getNavCounts } from "@/lib/queries/counts";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Belt-and-suspenders: middleware already redirects unauthenticated
  // requests before they reach here, but a Server Component that reads
  // session data shouldn't trust that alone.
  if (!session) redirect("/login");

  const counts = await getNavCounts();

  return (
    <div className="min-h-screen">
      <Sidebar counts={counts} session={session} />
      <div className="pl-[250px]">
        <Header session={session} />
        <main className="w-full pt-16 px-6 py-6 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
