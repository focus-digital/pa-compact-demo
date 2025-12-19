import { Identifier, IdentifierLinkItem, IdentifierLinks, Link } from '@trussworks/react-uswds';
import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { PageHeader } from './components/header';
import { useAuth } from '@/shared/hooks/auth-queries';

type AppLayoutProps = {
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileNavOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const identifierLinks = [
    { text: 'About the PA Compact', href: 'https://www.pacompact.org//about-pa-licensure-compact/' },
    { text: 'Resource Center', href: 'https://www.pacompact.org/compact-toolkit/' },
    { text: 'News & Updates', href: 'https://www.pacompact.org/news' },
    { text: 'FAQ', href: 'https://www.pacompact.org/FAQ' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>
      {/* <GovBanner /> */}

      <PageHeader user={user} mobileNavOpen={mobileNavOpen} onLogout={() => logout()} />
      
      <div style={{ flex: 1 }}>
        {children ? children : <Outlet />}
      </div>

      <Identifier className="border-top border-base-lighter padding-top-2">
        <IdentifierLinks
          navProps={{
            'aria-label': 'Important links',
          }}
        >
          {identifierLinks.map((link) => (
            <IdentifierLinkItem key={link.href}>
              <Link href={link.href} target="_blank" rel="noreferrer">
                {link.text}
              </Link>
            </IdentifierLinkItem>
          ))}
        </IdentifierLinks>
      </Identifier>
    </div>
  );
}
