"use client"
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogoSmall from '@/app/ui/acme-logo-small';
import { PowerIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import NextAuthSessionProvider from '@/app/provider';

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Check if current page is create or edit page
  const isCreateOrEditPage = pathname?.includes('/create') || pathname?.includes('/edit');

  // Close sidebar when navigating to create or edit pages
  useEffect(() => {
    if (isCreateOrEditPage) {
      setIsOpen(false);
    }
  }, [isCreateOrEditPage]);

  return (
    <>
      {/* Hover trigger zone - left edge of screen (disabled on create/edit pages) */}
      {!isCreateOrEditPage && (
        <div
          className="fixed left-0 top-0 w-4 h-full z-40"
          onMouseEnter={() => setIsOpen(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full w-56 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="flex h-full flex-col px-3 py-4 md:px-2">
          <Link
            className="mb-2 flex h-20 items-center justify-start rounded-md bg-white p-2 md:h-40"
            href="/"
          >
            <AcmeLogoSmall />
          </Link>
          <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
            <NextAuthSessionProvider>
              <NavLinks />
            </NextAuthSessionProvider>
            <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
            <button
              onClick={async () => {
                await signOut({ redirect: true, callbackUrl: "/" });
              }}
              className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
            >
              <PowerIcon className="w-6" />
              <div className="hidden md:block">Sign Out</div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
