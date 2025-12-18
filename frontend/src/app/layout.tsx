import { GovBanner, Identifier, IdentifierGov, IdentifierIdentity, IdentifierLinkItem, IdentifierLinks, IdentifierMasthead, Link } from '@trussworks/react-uswds';
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
  
  const identifierLinksText = ['About <Parent shortname>', 'Accessibility support', 'FOIA requests', 'No FEAR Act data', 'Office of the Inspector General', 'Performance reports', 'Privacy policy'];

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
          {identifierLinksText.map((text, idx) => (
            <IdentifierLinkItem key={idx}>
              <Link href="javascript:void(0);">{text}</Link>
            </IdentifierLinkItem>
          ))}
        </IdentifierLinks>
      </Identifier>
    </div>
  );
}
