import { ReactNode, useState } from 'react';

interface SideNavProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function NavButton({ children }: { children: ReactNode }) {
  return (
    <div className="p-2 hover:bg-gray-100 rounded-lg w-full">
      {children}
    </div>
  );
}

export default function SideNav({ trigger, children }: SideNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidenav */}
      <div className={`
        fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">功能選單</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
