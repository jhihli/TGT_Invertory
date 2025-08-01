"use client"
import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useSession } from "next-auth/react";

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  // { 
  //   name: 'Invoices',
  //   href: '/dashboard/invoices',
  //   icon: DocumentDuplicateIcon,
  // },
  // { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
];

export default function NavLinks() {

  const { data: session, status  } = useSession();
  const userRole = session?.user?.role;
  
  return (
    <>
      {links
        //Filter diff users see diff nav-pages
        .filter((link) => userRole === "admin" || link.name === "Home")
        .map((link) => {

          const LinkIcon = link.icon;
          return (
            <a
              key={link.name}
              href={link.href}
              className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
            >
              <LinkIcon className="w-6" />
              <p className="hidden md:block">{link.name}</p>
            </a>
          );
        })}
    </>
  );
}
