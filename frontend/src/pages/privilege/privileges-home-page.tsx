import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Checkbox,
  Grid,
  GridContainer,
  Label,
  Select,
  Table,
  TextInput,
  Textarea,
} from '@trussworks/react-uswds';

import {
  ApplicationStatus,
  LicenseSelfReportedStatus,
  QualifyingLicenseDesignationStatus,
  UserRole,
} from '@/shared/domain/enums';
import type { Privilege, PrivilegeApplication } from '@/shared/domain/types';
import { useAuth } from '@/shared/hooks/auth-queries';
import { useLicenses } from '@/shared/hooks/license-queries';
import { useMemberStates } from '@/shared/hooks/member-state-queries';
import {
  useApplyForPrivilege,
  usePayForPrivilege,
  usePrivilegeApplications,
  usePrivilegeReviewApplications,
  usePrivileges,
  useVerifyPrivilege,
} from '@/shared/hooks/privilege-queries';

const applicationSchema = z.object({
  remoteStateId: z.string().min(1, 'Select a remote state'),
  qualifyingLicenseId: z
    .string()
    .min(1, 'You must designate a qualifying license before applying'),
  attestationType: z.string().min(1, 'Attestation type is required'),
  attestationText: z.string().optional(),
  applicantNote: z.string().optional(),
  attestationAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the attestation'
  })
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const paymentSchema = z.object({
  applicationId: z.string().min(1, 'Select an application to pay for'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function PrivilegesHomePage() {
  const { user } = useAuth();
  const practitionerId = user?.practitioner?.id ?? null;
  const isPa = user?.role === UserRole.PA;
  const isStateAdmin = user?.role === UserRole.STATE_ADMIN;
  const { data: memberStates = [] } = useMemberStates();
  const { data: privileges = [], isLoading: privilegesLoading } = usePrivileges({
    enabled: isPa,
  });
  const {
    data: applications = [],
    isLoading: applicationsLoading,
  } = usePrivilegeApplications({ enabled: isPa });
  const { data: licenses = [] } = useLicenses(undefined, {
    enabled: isPa,
  });
  const applyMutation = useApplyForPrivilege();
  const payMutation = usePayForPrivilege();
  const verifyMutation = useVerifyPrivilege();
  const [showApplicationForms, setShowApplicationForms] = useState(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [pendingApplication, setPendingApplication] = useState<PrivilegeApplication | null>(null);

  const memberStateLookup = useMemo(() => {
    return memberStates.reduce<Record<string, string>>((acc, state) => {
      acc[state.id] = state.code;
      return acc;
    }, {});
  }, [memberStates]);

  const applicationForm = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      remoteStateId: '',
      qualifyingLicenseId: '',
      attestationType: 'State Jurisprudence Compliance',
      attestationText:
        'I, [Full Name], hereby certify that I have read, understood, and agree to comply with the State Physician Assistant Practice Act and all applicable administrative rules and regulations. I attest that I have successfully completed any required state jurisprudence assessment and acknowledge that I am legally responsible for adhering to State\'s specific laws and scope of practice while exercising a Compact Privilege. I understand that any violation of these statutes may result in the loss of my privilege to practice and will be reported to the PA Licensure Compact Commission and my home state licensing board.',
      applicantNote: '',
      attestationAccepted: false,
    },
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      applicationId: '',
      amount: 100,
    },
  });
  const amountValue = paymentForm.watch('amount');

  const activeQualifyingLicense = useMemo(() => {
    return licenses.find((license) =>
      license.qualifyingDesignations?.some(
        (designation) => designation.status === QualifyingLicenseDesignationStatus.ACTIVE,
      ),
    );
  }, [licenses]);

  useEffect(() => {
    if (activeQualifyingLicense) {
      applicationForm.setValue('qualifyingLicenseId', activeQualifyingLicense.id);
      if (activeQualifyingLicense.practitioner?.user) {
        const fullName = `${activeQualifyingLicense.practitioner.user.firstName ?? ''} ${activeQualifyingLicense.practitioner.user.lastName ?? ''}`.trim();
        applicationForm.setValue(
          'attestationText',
          `I, ${fullName}, hereby certify that I have read, understood, and agree to comply with the State Physician Assistant Practice Act and all applicable administrative rules and regulations. I attest that I have successfully completed any required state jurisprudence assessment and acknowledge that I am legally responsible for adhering to State's specific laws and scope of practice while exercising a Compact Privilege. I understand that any violation of these statutes may result in the loss of my privilege to practice and will be reported to the PA Licensure Compact Commission and my home state licensing board.`,
        );
      }
    } else {
      applicationForm.setValue('qualifyingLicenseId', '');
      applicationForm.setValue('attestationText', '');
    }
  }, [activeQualifyingLicense, applicationForm]);

  const activeLicenseStateIds = useMemo(() => {
    return new Set(
      licenses
        .filter((license) => license.selfReportedStatus === LicenseSelfReportedStatus.ACTIVE)
        .map((license) => license.issuingStateId),
    );
  }, [licenses]);

  const availableRemoteStates = useMemo(() => {
    return memberStates.filter((state) => !activeLicenseStateIds.has(state.id));
  }, [memberStates, activeLicenseStateIds]);

  const {
    data: reviewApplications = [],
    isLoading: reviewLoading,
  } = usePrivilegeReviewApplications({
    enabled: isStateAdmin,
  });

  const filteredApplications = useMemo(() => {
    return applications as PrivilegeApplication[];
  }, [applications]);

  const reviewRows = useMemo(() => {
    return (reviewApplications as PrivilegeApplication[]).map((application) => {
      const practitionerName = application.practitioner?.user
        ? `${application.practitioner.user.firstName ?? ''} ${application.practitioner.user.lastName ?? ''}`.trim()
        : application.practitionerId;

      return {
        id: application.id,
        practitionerName: practitionerName || application.practitionerId,
        licenseNumber:
          application.qualifyingLicense?.licenseNumber ?? application.qualifyingLicenseId,
        submitted: formatDate(application.createdAt),
        note: application.applicantNote ?? '—',
      };
    });
  }, [reviewApplications]);

  const privilegeRows = useMemo(() => {
    return (privileges as Privilege[]).map((privilege) => ({
      id: privilege.id,
      stateLabel:
        privilege.remoteState?.code ??
        memberStateLookup[privilege.remoteStateId] ??
        privilege.remoteStateId,
      licenseLabel: privilege.qualifyingLicense?.licenseNumber ?? privilege.qualifyingLicenseId,
      status: privilege.status,
      issuedAt: formatDate(privilege.issuedAt),
      expiresAt: formatDate(privilege.expiresAt),
    }));
  }, [privileges, memberStateLookup]);

  const applicationRows = useMemo(() => {
    return filteredApplications.map((application) => ({
      id: application.id,
      remoteStateLabel:
        application.remoteState?.code ??
        memberStateLookup[application.remoteStateId] ??
        application.remoteStateId,
      licenseLabel:
        application.qualifyingLicense?.licenseNumber ?? application.qualifyingLicenseId,
      status: application.status,
      paymentStatus: application.payment?.status ?? 'Not paid',
      createdAt: formatDate(application.createdAt),
    }));
  }, [filteredApplications, memberStateLookup]);

  async function onSubmitApplication(values: ApplicationFormValues) {
    if (!isPa || !practitionerId) {
      alert('Only practitioners with a profile may apply for privileges.');
      return;
    }
    if (!values.qualifyingLicenseId) {
      alert('You need an active qualifying license before applying.');
      return;
    }

    try {
      const application = await applyMutation.mutateAsync({
        practitionerId,
        remoteStateId: values.remoteStateId,
        qualifyingLicenseId: values.qualifyingLicenseId,
        attestationType: values.attestationType,
        attestationText: values.attestationText,
        attestationAccepted:!!values.attestationAccepted,
        applicantNote: values.applicantNote,
      });
      applicationForm.reset({
        remoteStateId: '',
        qualifyingLicenseId: activeQualifyingLicense?.id ?? '',
        attestationType: '',
        attestationText: '',
        applicantNote: '',
        attestationAccepted: false,
      });
      setCurrentApplicationId(application.id);
      setPendingApplication(application);
      paymentForm.reset({
        applicationId: application.id,
        amount: 100,
      });
    } catch (error) {
      console.error('Failed to submit privilege application', error);
      alert('Failed to submit privilege application');
    }
  }

  async function onSubmitPayment(values: PaymentFormValues) {
    try {
      await payMutation.mutateAsync({
        applicationId: values.applicationId,
        amount: values.amount,
      });
      paymentForm.reset({
        applicationId: '',
        amount: 100,
      });
      setCurrentApplicationId(null);
      setPendingApplication(null);
      setShowApplicationForms(false);
    } catch (error) {
      console.error('Failed to record payment', error);
      alert('Failed to record payment');
    }
  }

  async function onApproveApplication(applicationId: string) {
    try {
      await verifyMutation.mutateAsync({
        applicationId,
        status: ApplicationStatus.APPROVED,
      });
    } catch (error) {
      console.error('Failed to approve application', error);
      alert('Failed to approve application');
    }
  }

  const currentApplication = useMemo(() => {
    if (!currentApplicationId) {
      return null;
    }
    return (
      filteredApplications.find((application) => application.id === currentApplicationId) ??
      (pendingApplication?.id === currentApplicationId ? pendingApplication : null)
    );
  }, [currentApplicationId, filteredApplications, pendingApplication]);

  const canSubmitApplication = Boolean(activeQualifyingLicense) && availableRemoteStates.length > 0;

  if (!isPa && !isStateAdmin) {
    return (
      <div className="usa-section">
        <GridContainer>
          <Grid row gap>
            <main
              className="usa-layout-docs__main desktop:grid-col-12 usa-prose usa-layout-docs"
              id="main-content"
            >
              <h1>Privileges</h1>
              <p>This workspace is available to practitioner or state admin accounts only.</p>
            </main>
          </Grid>
        </GridContainer>
      </div>
    );
  }

  if (isStateAdmin) {
    return (
      <div className="usa-section">
        <GridContainer>
          <Grid row gap>
            <main
              className="usa-layout-docs__main desktop:grid-col-12 usa-prose usa-layout-docs"
              id="main-content"
            >
              <h1>Privilege Review Queue</h1>
              <p className="margin-bottom-2">
                Review applications that are currently under review in your member state.
              </p>
              {reviewLoading ? (
                <p>Loading applications…</p>
              ) : (
                <Table fullWidth striped>
                  <thead>
                    <tr>
                      <th scope="col">Practitioner</th>
                      <th scope="col">Qualifying License</th>
                      <th scope="col">Applicant Note</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewRows.length === 0 && (
                      <tr>
                        <td colSpan={5}>No applications awaiting review.</td>
                      </tr>
                    )}
                    {reviewRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div>{row.practitionerName}</div>
                        </td>
                        <td>{row.licenseNumber}</td>
                        <td>{row.note}</td>
                        <td>{row.submitted}</td>
                        <td>
                          <Button
                            type="button"
                            disabled={verifyMutation.isPending}
                            onClick={() => onApproveApplication(row.id)}
                          >
                            Approve
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </main>
          </Grid>
        </GridContainer>
      </div>
    );
  }

  return (
    <div className="usa-section">
      <GridContainer>
        <Grid row gap>
          <main
            className="usa-layout-docs__main desktop:grid-col-12 usa-prose usa-layout-docs"
            id="main-content"
          >
            <div className="display-flex flex-justify margin-bottom-2">
              {isPa && (
                <Button
                  type="button"
                  className="align-self-start margin-top-1"
                  onClick={() => setShowApplicationForms((prev) => !prev)}
                >
                  {showApplicationForms ? 'Close Privilege Flow' : 'Apply for Privilege'}
                </Button>
              )}
            </div>

            {showApplicationForms && isPa && (
              <div className="border border-base-lighter padding-2 margin-bottom-3">
                {!currentApplicationId ? (
                  <>
                    <h2 className="margin-top-0">Step 1: Application &amp; Attestation</h2>
                    <form onSubmit={applicationForm.handleSubmit(onSubmitApplication)}>
                      <Grid row gap="md">
                        <Grid tabletLg={{ col: 6 }}>
                          <Label htmlFor="remoteStateId">Remote State</Label>
                          <Select
                            id="remoteStateId"
                            {...applicationForm.register('remoteStateId')}
                            disabled={!availableRemoteStates.length}
                          >
                            <option value="">
                              {availableRemoteStates.length ? 'Select a remote state' : 'No eligible states'}
                            </option>
                            {availableRemoteStates.map((state) => (
                              <option key={state.id} value={state.id}>
                                {state.code} - {state.name}
                              </option>
                            ))}
                          </Select>
                          {applicationForm.formState.errors.remoteStateId && (
                            <span className="text-red">
                              {applicationForm.formState.errors.remoteStateId.message}
                            </span>
                          )}
                          {!availableRemoteStates.length && (
                            <span className="text-base">
                              You already have active licenses in each state, so no remote states are eligible.
                            </span>
                          )}
                        </Grid>
                        <Grid tabletLg={{ col: 6 }}>
                          <Label htmlFor="qualifyingLicenseId">Qualifying License</Label>
                          {activeQualifyingLicense ? (
                            <div className="padding-y-05 text-bold">
                              {activeQualifyingLicense.licenseNumber} (
                              {activeQualifyingLicense.issuingState?.code ?? 'Unknown'}) - Active
                            </div>
                          ) : (
                            <div className="text-base">
                              You must designate a qualifying license before applying.
                            </div>
                          )}
                          <input
                            type="hidden"
                            id="qualifyingLicenseId"
                            {...applicationForm.register('qualifyingLicenseId')}
                          />
                          {applicationForm.formState.errors.qualifyingLicenseId && (
                            <span className="text-red">
                              {applicationForm.formState.errors.qualifyingLicenseId.message}
                            </span>
                          )}
                        </Grid>
                      </Grid>

                      <Grid row gap="md" className="margin-top-2">
                        <Grid tabletLg={{ col: 6 }}>
                          <Label htmlFor="attestationType">Attestation Type</Label>
                          <TextInput
                            type="text"
                            id="attestationType"
                            {...applicationForm.register('attestationType')}
                            readOnly
                            aria-readonly="true"
                            className="bg-base-lightest"
                            style={{ backgroundColor: '#f0f0f0', color: '#5c5c5c' }}
                          />
                          {applicationForm.formState.errors.attestationType && (
                            <span className="text-red">
                              {applicationForm.formState.errors.attestationType.message}
                            </span>
                          )}
                        </Grid>
                        <Grid tabletLg={{ col: 6 }}>
                          <Label htmlFor="attestationText">Attestation Text</Label>
                          <Textarea
                            id="attestationText"
                            {...applicationForm.register('attestationText')}
                            rows={6}
                            readOnly
                            aria-readonly="true"
                            className="bg-base-lightest"
                            style={{ backgroundColor: '#f0f0f0', color: '#5c5c5c' }}
                          />
                        </Grid>
                      </Grid>

                      <Grid row gap="md" className="margin-top-2">
                        <Grid tabletLg={{ col: 6 }}>
                          <Label htmlFor="applicantNote">Applicant Note</Label>
                          <Textarea
                            id="applicantNote"
                            {...applicationForm.register('applicantNote')}
                            rows={3}
                          />
                        </Grid>
                        <Grid tabletLg={{ col: 6 }} className="display-flex flex-column flex-justify-end">
                          <Checkbox
                            id="attestationAccepted"
                            {...applicationForm.register('attestationAccepted')}
                            label="I confirm all statements above are true."
                          />
                          {applicationForm.formState.errors.attestationAccepted && (
                            <span className="text-red">
                              {applicationForm.formState.errors.attestationAccepted.message}
                            </span>
                          )}
                        </Grid>
                      </Grid>

                      <Button
                        type="submit"
                        className="margin-top-3"
                        disabled={
                          !canSubmitApplication ||
                          applicationForm.formState.isSubmitting ||
                          applyMutation.isPending
                        }
                      >
                        Submit Application
                      </Button>
                      {!activeQualifyingLicense && (
                        <p className="text-base margin-top-1">
                          Designate a qualifying license on the Licenses page to continue.
                        </p>
                      )}
                    </form>
                  </>
                ) : (
                  <div className="usa-alert usa-alert--info margin-bottom-3">
                    <div className="usa-alert__body">
                      <p className="usa-alert__text">
                        Your application has been submitted. Complete payment below to finish the process.
                      </p>
                    </div>
                  </div>
                )}

                {currentApplicationId ? (
                  <>
                    <h2 className="margin-top-4">Step 2: Payment</h2>
                    {currentApplication && (
                      <p>
                        Application for{' '}
                        {memberStateLookup[currentApplication.remoteStateId] ??
                          currentApplication.remoteStateId}{' '}
                        · Status: {currentApplication.status}
                      </p>
                    )}
                    <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)}>
                      <input type="hidden" {...paymentForm.register('applicationId')} />
                      <input
                        type="hidden"
                        {...paymentForm.register('amount', { valueAsNumber: true })}
                      />
                      <Grid row gap="md">
                        <Grid tabletLg={{ col: 6 }}>
                          <Label htmlFor="amount">Amount $</Label>
                          <TextInput
                            id="amount"
                            name="amount"
                            type="text"
                            value={amountValue ?? ''}
                            readOnly
                            disabled
                            className="bg-base-lightest"
                            style={{ backgroundColor: '#f0f0f0', color: '#5c5c5c' }}
                          />
                          {paymentForm.formState.errors.amount && (
                            <span className="text-red">
                              {paymentForm.formState.errors.amount.message}
                            </span>
                          )}
                        </Grid>
                      </Grid>

                      <Button
                        type="submit"
                        className="margin-top-3"
                        disabled={paymentForm.formState.isSubmitting || payMutation.isPending}
                      >
                        Submit Payment
                      </Button>
                    </form>
                  </>
                ) : (
                  <p className="margin-top-4 text-italic">
                    Submit an application to continue to the payment step.
                  </p>
                )}
              </div>
            )}

            <section className="margin-bottom-4">
              <h2>Current Privileges</h2>
              {privilegesLoading ? (
                <p>Loading privileges…</p>
              ) : (
                <Table fullWidth striped>
                  <thead>
                    <tr>
                      <th scope="col">Remote State</th>
                      <th scope="col">License</th>
                      <th scope="col">Status</th>
                      <th scope="col">Issued</th>
                      <th scope="col">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {privilegeRows.length === 0 && (
                      <tr>
                        <td colSpan={5}>No privileges yet.</td>
                      </tr>
                    )}
                    {privilegeRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.stateLabel}</td>
                        <td>{row.licenseLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.issuedAt}</td>
                        <td>{row.expiresAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </section>

            <section>
              <h2>Privilege Applications</h2>
              {applicationsLoading ? (
                <p>Loading applications…</p>
              ) : (
                <Table fullWidth striped>
                  <thead>
                    <tr>
                      <th scope="col">Remote State</th>
                      <th scope="col">License</th>
                      <th scope="col">Status</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationRows.length === 0 && (
                      <tr>
                        <td colSpan={5}>No privilege applications yet.</td>
                      </tr>
                    )}
                    {applicationRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.remoteStateLabel}</td>
                        <td>{row.licenseLabel}</td>
                        <td>{row.status}</td>
                        <td>{row.paymentStatus}</td>
                        <td>{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </section>
          </main>
        </Grid>
      </GridContainer>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
