import SideNav from '@/app/ui/dashboard/sidenav';


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <SideNav />
      <div className="flex-grow p-3 md:overflow-y-auto md:p-6 w-full">{children}</div>
    </div>
  );
}