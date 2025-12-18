import type { User } from "@/shared/domain/types"
import { Link as RouterLink } from 'react-router-dom';
import { ExtendedNav, Header, Title } from '@trussworks/react-uswds';

type HeaderProps = {
  user: User | null;
  mobileNavOpen: boolean;
  onLogout: () => void;
}

export function PageHeader({ user, mobileNavOpen, onLogout }: HeaderProps) {
  const primaryNavItems = [
    // <RouterLink key="primaryNav_2" className="usa-nav__link" to="/"><span>Home</span></RouterLink>,
    <RouterLink key="primaryNav_2" className="usa-nav__link" to="licenses"><span>Licenses</span></RouterLink>,
    <RouterLink key="primaryNav_2" className="usa-nav__link" to="apply"><span>Apply</span></RouterLink>
  ];
  const secondaryNavItems = [<a key="secondaryNav_0" href="">
      {user?.email}
    </a>, <a key="secondaryNav_1" onClick={onLogout}>
      Logout
    </a>]

  const toggleMobileNav = (): void => {
    // setMobileNavOpen(prevOpen => !prevOpen);
  };

  return (
    <Header basic showMobileOverlay={mobileNavOpen} className="border-bottom border-base-lighter">
      <div className="usa-nav-container">
        <div className="usa-navbar">
          <Title id="basic-logo">
            <a href="javascript:void(0);" title="Home" aria-label="Home">
              {'Licensure System'}
            </a>
          </Title>
          <p>
            PA Compact Commission
          </p>
        </div>
        {(user !== null) && (
          <ExtendedNav aria-label="Primary navigation" primaryItems={primaryNavItems} secondaryItems={secondaryNavItems} onToggleMobileNav={toggleMobileNav} mobileExpanded={mobileNavOpen}>
          </ExtendedNav>
        )}        
      </div>
    </Header>
  )
}
