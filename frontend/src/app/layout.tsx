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

  return <>
      <a className="usa-skipnav" href="#main-content">
        Skip to main content
      </a>
      {/* <GovBanner /> */}

      <PageHeader user={user} mobileNavOpen={mobileNavOpen} onLogout={() => logout()} />
      
      {children ? children : <Outlet /> }

      <Identifier>
        {/* <IdentifierMasthead aria-label="Agency identifier">
          <IdentifierIdentity domain={'https://www.pacompact.org/'}>
            <span aria-hidden="true">An</span> official website of the{' '}
            <Link href="javascript:void(0);">{`<Parent agency>`}</Link>
          </IdentifierIdentity>
        </IdentifierMasthead> */}
        <IdentifierLinks navProps={{
        'aria-label': 'Important links'
      }}>
          {identifierLinksText.map((text, idx) => <IdentifierLinkItem key={idx}>
              <Link href="javascript:void(0);">{text}</Link>
            </IdentifierLinkItem>)}
        </IdentifierLinks>
        {/* <IdentifierGov aria-label="U.S. government information and services">
          <div className="usa-identifier__usagov-description">
            Looking for U.S. government information and services?
          </div>
          &nbsp;
          <Link href="javascript:void(0);" className="usa-link">
            Visit USA.gov
          </Link>
        </IdentifierGov> */}
      </Identifier>
    </>;
}