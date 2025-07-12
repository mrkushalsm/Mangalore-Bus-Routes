'use client';
import type { PropsWithChildren } from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Bus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Nav, navItems } from './nav';
import { usePathname } from 'next/navigation';


export function AppLayout({ children }: PropsWithChildren) {
    const pathname = usePathname();
    const currentPage = navItems.find((item) => item.href === pathname);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Bus className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold font-headline">Mangalore Buses</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <Nav />
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 md:px-6">
            <SidebarTrigger>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SidebarTrigger>
            <h1 className="text-lg font-semibold md:text-xl font-headline">
              {currentPage?.label || 'Dashboard'}
            </h1>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
