import type { User } from "@/shared/domain/types"
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ExtendedNav, Header, Title } from '@trussworks/react-uswds';

type HeaderProps = {
  user: User | null;
  mobileNavOpen: boolean;
  onLogout: () => void;
}

export function PageHeader({ user, mobileNavOpen, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const primaryNavItems = [
    <RouterLink key="nav-licenses" className="usa-nav__link" to="licenses">
      <span>Licenses</span>
    </RouterLink>,
    <RouterLink key="nav-privileges" className="usa-nav__link" to="privileges">
      <span>Privileges</span>
    </RouterLink>,
  ];
  const displayName =
    user
      ? `${user?.firstName} ${user.lastName}`.trim()
      : '';

  const secondaryNavItems = [<a key="secondaryNav_0" href="">
      {displayName}
    </a>, <a
      key="secondaryNav_1"
      onClick={onLogout}
      style={{ cursor: 'pointer' }}
    >
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
            <button
              type="button"
              className="usa-button usa-button--unstyled text-no-underline font-body-lg"
              onClick={() => navigate('/')}
              aria-label="Home"
            >
              Licensure System Demo
            </button>
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
