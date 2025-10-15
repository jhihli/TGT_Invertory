import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div>
      <Image
        src="/tgtlogo.jpg"
        alt="TGT Logo"
        width={360}
        height={120}
        priority
        className="object-contain w-auto h-auto max-w-none"
        style={{ width: '260px', height: '100px' }}
      />
    </div>
  );
}
