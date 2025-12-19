import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Grid, GridContainer } from '@trussworks/react-uswds';

import { UserRole, PrivilegeStatus, ApplicationStatus, LicenseVerificationStatus } from '@/shared/domain/enums';
import { useAuth } from '@/shared/hooks/auth-queries';
import { useLicenses } from '@/shared/hooks/license-queries';
import {
  usePrivilegeApplications,
  usePrivilegeReviewApplications,
  usePrivileges,
} from '@/shared/hooks/privilege-queries';

export function HomePage() {
  const { user } = useAuth();
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Guest';
  const isPa = user?.role === UserRole.PA;
  const isStateAdmin = user?.role === UserRole.STATE_ADMIN;

  const {
    data: privileges = [],
    isLoading: privilegesLoading,
  } = usePrivileges({ enabled: isPa });
  const {
    data: privilegeApplications = [],
    isLoading: applicationsLoading,
  } = usePrivilegeApplications({ enabled: isPa });
  const {
    data: reviewApplications = [],
    isLoading: reviewLoading,
  } = usePrivilegeReviewApplications({ enabled: isStateAdmin });
  const {
    data: licenses = [],
    isLoading: licensesLoading,
  } = useLicenses(isStateAdmin ? LicenseVerificationStatus.UNVERIFIED : undefined, {
    enabled: isPa || isStateAdmin,
  });

  const activePrivilegeCount = useMemo(() => {
    if (!isPa) return 0;
    return privileges.filter((privilege) => privilege.status === PrivilegeStatus.ACTIVE).length;
  }, [isPa, privileges]);

  const pendingPrivilegeCount = useMemo(() => {
    if (!isPa) return 0;
    return privilegeApplications.filter((application) =>
      [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW].includes(application.status),
    ).length;
  }, [isPa, privilegeApplications]);

  const licenseCount = isPa ? licenses.length : 0;
  const reviewPrivilegeCount = isStateAdmin ? reviewApplications.length : 0;
  const reviewLicenseCount = isStateAdmin ? licenses.length : 0;

  return (
    <div className="usa-section">
      <GridContainer>
        <Grid row gap>
          <main
            className="usa-layout-docs__main desktop:grid-col-9 usa-prose usa-layout-docs"
            id="main-content"
          >
            <h1>Welcome</h1>

            <p className="margin-bottom-4">Welcome back, {displayName || 'Guest'}.</p>

            {isPa && (
              <>
                <section className="margin-bottom-4">
                  <h2>Privileges overview</h2>
                  {privilegesLoading || applicationsLoading ? (
                    <p>Loading privilege information…</p>
                  ) : (
                    <div className="border border-base-lighter padding-2">
                      <p className="margin-top-0">
                        <strong>{activePrivilegeCount}</strong> active privileges
                      </p>
                      <p>
                        <strong>{pendingPrivilegeCount}</strong> privilege applications pending approval
                      </p>
                      <RouterLink className="usa-button margin-top-1" to="/privileges">
                        View or Apply for Privileges
                      </RouterLink>
                    </div>
                  )}
                </section>

                <section>
                  <h2>Licenses overview</h2>
                  {licensesLoading ? (
                    <p>Loading license information…</p>
                  ) : (
                    <div className="border border-base-lighter padding-2">
                      <p className="margin-top-0">
                        <strong>{licenseCount}</strong> licenses added
                      </p>
                      <RouterLink className="usa-button margin-top-1" to="/licenses">
                        View or Add Licenses
                      </RouterLink>
                    </div>
                  )}
                </section>
              </>
            )}

            {isStateAdmin && (
              <section className="margin-bottom-4">
                <h2>Review queue</h2>
                {reviewLoading || licensesLoading ? (
                  <p>Loading review workload…</p>
                ) : (
                  <div className="border border-base-lighter padding-2">
                    <div className="margin-bottom-2">
                      <p className="margin-y-0">
                        <strong>{reviewPrivilegeCount}</strong> privilege applications pending review
                      </p>
                      <RouterLink className="usa-button margin-top-1" to="/privileges">
                        Review Privileges
                      </RouterLink>
                    </div>
                    <div>
                      <p className="margin-y-0">
                        <strong>{reviewLicenseCount}</strong> licenses awaiting verification
                      </p>
                      <RouterLink className="usa-button margin-top-1" to="/licenses">
                        Review Licenses
                      </RouterLink>
                    </div>
                  </div>
                )}
              </section>
            )}

            {!isPa && !isStateAdmin && <p>Select a workflow from the navigation to get started.</p>}
          </main>
        </Grid>
      </GridContainer>
    </div>
  );
}
