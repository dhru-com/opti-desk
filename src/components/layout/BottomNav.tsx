'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusCircle, CreditCard, MoreHorizontal } from 'lucide-react';

const navItems = [
  { name: 'Today', href: '/', icon: Home },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Add', href: '/add', icon: PlusCircle, isCenter: true },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'More', href: '/more', icon: MoreHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                item.isCenter ? 'text-blue-600' : isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon size={item.isCenter ? 32 : 24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
