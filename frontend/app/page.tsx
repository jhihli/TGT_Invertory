"use client"
import AcmeLogo from '@/app/ui/acme-logo';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function Page() {

  return (
    <main className="flex min-h-screen flex-col p-6">
      <div className="flex h-20 shrink-0 items-center justify-start rounded-lg bg-gray-50 p-4 md:h-52">
        <div className="w-full max-w-sm">
            <AcmeLogo />
        </div>
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-50 px-6 py-10 md:w-2/5 md:px-20">
          <p className={`text-xl text-gray-800 md:text-3xl md:leading-normal font-semibold transition-opacity duration-300 hover:opacity-80`}>
            <strong>Welcome to TGT Inventory System.</strong> 
          </p>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-transform transition-shadow duration-300 hover:bg-blue-400 hover:shadow-xl hover:scale-105 md:text-base"
          >
            <span>Visit</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex items-center justify-center p-6 md:w-3/5 md:px-28 md:py-12 transition-opacity duration-300 hover:opacity-90">
            <Image
            src="/hero-desktop.png"
            width={1000}
            height={760}
            className="hidden md:block rounded-lg shadow-lg transition-transform transition-opacity duration-300 hover:scale-105 hover:opacity-95 hover:shadow-xl"
            alt="Screenshots of the dashboard project showing desktop version"
          />
        </div>
      </div>
    </main>
  );
}
