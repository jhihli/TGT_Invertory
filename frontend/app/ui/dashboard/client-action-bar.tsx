'use client';

import { DeleteButton } from './delete-button';
import { CreateProduct } from './buttons';
import { DeleteMessage } from './table';
import ExportButton from './export-button';
import TicketButton from './ticket-button';
import Search from '@/app/ui/search';
import AppearanceFormButton from './appearance-button';
import FlashFormButton from './flash-button';
import RamFormButton from './ram-button';
import BoundButton from './bound-button';
import { Bars3Icon } from '@heroicons/react/24/outline';
import SideNav, { NavButton } from './side-nav';

export default function ClientActionBar({
  query,
}: {
  query: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center w-full sm:w-auto">
          <Search placeholder="Search products..." defaultDate={today} />
          <div className="ml-2">
            <DeleteMessage />
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {/* 主要按鈕保留在介面上 */}
          
          <DeleteButton />
          <CreateProduct />
          
          
          {/* 側邊導覽列 */}
          <SideNav trigger={
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
          }>
            <NavButton>
              <ExportButton query={query} />
            </NavButton>
            <NavButton>
              <BoundButton query={query} />
            </NavButton>
            <NavButton>
              <RamFormButton query={query} />
            </NavButton>
            <NavButton>
              <FlashFormButton query={query} />
            </NavButton>
            <NavButton>
              <AppearanceFormButton query={query} />
            </NavButton>
            <NavButton>
              <TicketButton query={query} />
            </NavButton>
          </SideNav>
        </div>
      </div>
    </div>
  );
}
