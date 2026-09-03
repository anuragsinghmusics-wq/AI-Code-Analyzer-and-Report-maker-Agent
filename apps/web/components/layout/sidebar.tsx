'use client';

// apps/web/components/layout/sidebar.tsx — Organizer sidebar navigation
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1.5 2h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5zm0 7h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5zm7-7h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5zm0 7h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5z"/>
      </svg>
    ),
  },
  {
    label: 'Hackathons',
    href: '/hackathons',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 4.143C8 6.267 6.5 8 4.5 8S1 6.267 1 4.143C1 2.019 2.5.286 4.5.286S8 2.019 8 4.143zM4.5 7c1.38 0 2.5-1.27 2.5-2.857S5.88 1.286 4.5 1.286 2 2.556 2 4.143 3.12 7 4.5 7z"/>
        <path d="M7.5 12.714C7.5 14.838 6 16.571 4 16.571S.5 14.838.5 12.714C.5 10.59 2 8.857 4 8.857s3.5 1.733 3.5 3.857zm-3.5 2.857c1.38 0 2.5-1.27 2.5-2.857S5.38 9.857 4 9.857 1.5 11.127 1.5 12.714 2.62 15.571 4 15.571z"/>
        <path d="M15.5 4.143C15.5 6.267 14 8 12 8S8.5 6.267 8.5 4.143C8.5 2.019 10 .286 12 .286s3.5 1.733 3.5 3.857zM12 7c1.38 0 2.5-1.27 2.5-2.857S13.38 1.286 12 1.286 9.5 2.556 9.5 4.143 10.62 7 12 7z"/>
        <path d="M15.5 12.714C15.5 14.838 14 16.571 12 16.571s-3.5-1.733-3.5-3.857c0-2.124 1.5-3.857 3.5-3.857s3.5 1.733 3.5 3.857zm-3.5 2.857c1.38 0 2.5-1.27 2.5-2.857S13.38 9.857 12 9.857s-2.5 1.27-2.5 2.857 1.12 2.857 2.5 2.857z"/>
      </svg>
    ),
  },
  {
    label: 'History',
    href: '/dashboard/history',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
        <path d="M7.5 3a.5.5 0 0 1 .5.5v4.383l2.146 2.147a.5.5 0 0 1-.707.707l-2.354-2.354A.5.5 0 0 1 7 8V3.5a.5.5 0 0 1 .5-.5z"/>
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo / wordmark */}
      <div
        className="flex items-center gap-2 px-4 h-14 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: '#2F81F7', color: '#fff', fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          CJ
        </div>
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-inter)' }}
        >
          CodeJudge
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm transition-colors duration-100"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-overlay)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    'var(--bg-overlay)';
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                    'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--text-secondary)';
                }
              }}
            >
              <span
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer section — sign out link */}
      <div
        className="px-2 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded text-sm w-full text-left transition-colors duration-100"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-overlay)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
