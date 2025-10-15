import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogoSmall() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center justify-start leading-none bg-transparent`}
    >
      <Image
        src="/tgtlogo.jpg"
        alt="TGT Logo"
        width={200}
        height={60}
        priority
        className="object-contain"
        style={{ width: '200px', height: '60px' }}
      />
    </div>
  );
}
