import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import gsap from 'gsap';

export function Layout({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Simple entry animation for page content
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [children]); // Re-run when children (route) changes

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar with responsive overlay */}
      <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : ''} relative z-10 h-screen overflow-y-auto transition-all duration-300`}>
        {/* Mobile menu button */}
        <div className="fixed top-4 left-4 z-20 md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-card/50 backdrop-blur border border-white/10 text-white hover:bg-card/70 transition-all"
            data-testid="button-toggle-sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="container mx-auto p-8 max-w-7xl" ref={contentRef}>
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
