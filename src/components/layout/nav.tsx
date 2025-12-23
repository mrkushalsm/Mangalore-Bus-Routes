'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Search, Bus, Star, AlertCircle } from 'lucide-react';

export const navItems = [
  { href: '/', label: 'Route Finder', icon: Search },
  { href: '/routes', label: 'All Routes', icon: Bus },
  { href: '/saved', label: 'Saved Journeys', icon: Star },

];

export function Nav() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link 
              href={item.href}
              onClick={() => {
                if (isMobile) {
                  setOpenMobile(false);
                }
              }}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
