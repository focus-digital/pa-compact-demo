import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Grid,
  GridContainer,
  Modal,
  ModalFooter,
  ModalToggleButton,
  type ModalRef,
  Label,
  DatePicker,
  Select,
  Table,
  TextInput,
} from '@trussworks/react-uswds';

import {
  LicenseSelfReportedStatus,
  LicenseVerificationStatus,
  QualifyingLicenseDesignationStatus,
  UserRole,
} from '@/shared/domain/enums';
import { useAuth } from '@/shared/hooks/auth-queries';
import {
  useAddLicense,
  useDesignateLicense,
  useLicenses,
  useVerifyLicense,
} from '@/shared/hooks/license-queries';
import { useMemberStates } from '@/shared/hooks/member-state-queries';

const addLicenseSchema = z.object({
  issuingStateId: z.string().min(1, 'Issuing state is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expirationDate: z.string().min(1, 'Expiration date is required'),
  selfReportedStatus: z.nativeEnum(LicenseSelfReportedStatus),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
});

type AddLicenseFormValues = z.infer<typeof addLicenseSchema>;

const selfReportedOptions = Object.values(LicenseSelfReportedStatus);

export function LicenseHomePage() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDesignationId, setPendingDesignationId] = useState<string | null>(null);
  const { data: licenses = [], isLoading } = useLicenses(
    user?.role === UserRole.STATE_ADMIN ? LicenseVerificationStatus.UNVERIFIED : undefined,
  );
  const addMutation = useAddLicense();
  const verifyMutation = useVerifyLicense();
  const designateMutation = useDesignateLicense();
  const { data: memberStates = [], isLoading: statesLoading } = useMemberStates();
  const modalRef = useRef<ModalRef>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddLicenseFormValues>({
    resolver: zodResolver(addLicenseSchema),
    defaultValues: {
      issuingStateId: '',
      licenseNumber: '',
      issueDate: '',
      expirationDate: '',
      selfReportedStatus: LicenseSelfReportedStatus.ACTIVE,
      evidenceUrl: '',
    },
  });

  const isPa = user?.role === UserRole.PA;
  const isStateAdmin = user?.role === UserRole.STATE_ADMIN;

  async function onAddLicense(values: AddLicenseFormValues) {
    try {
      await addMutation.mutateAsync({
        issuingStateId: values.issuingStateId,
        licenseNumber: values.licenseNumber,
        issueDate: values.issueDate,
        expirationDate: values.expirationDate,
        selfReportedStatus: values.selfReportedStatus,
        evidenceUrl: values.evidenceUrl || undefined,
      });
      reset();
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add license', error);
      alert('Failed to add license');
    }
  }

  async function onVerifyLicense(licenseId: string) {
    try {
      await verifyMutation.mutateAsync({ licenseId });
    } catch (error) {
      console.error('Failed to verify license', error);
      alert('Failed to verify license');
    }
  }

  async function confirmDesignation() {
    if (!pendingDesignationId) {
      return;
    }

    try {
      await designateMutation.mutateAsync({ licenseId: pendingDesignationId });
      modalRef.current?.toggleModal();
      setPendingDesignationId(null);
    } catch (error) {
      console.error('Failed to designate license', error);
      alert('Failed to designate license');
    }
  }

  const rows = useMemo(() => {
    return licenses.map((license) => ({
      ...license,
      issuingStateLabel: license.issuingState?.code ?? license.issuingStateId,
      issueDateLabel: formatDate(license.issueDate),
      expirationDateLabel: formatDate(license.expirationDate),
      designationLabel: license.qualifyingDesignations?.[0]?.status ?? 'Not designated',
      practitionerName: license.practitioner?.user
        ? `${license.practitioner.user.firstName} ${license.practitioner.user.lastName}`.trim()
        : 'Unknown',
      canDesignate:
        isPa &&
        license.verificationStatus === LicenseVerificationStatus.VERIFIED &&
        license.qualifyingDesignations?.[0]?.status !== QualifyingLicenseDesignationStatus.ACTIVE,
      canVerify: isStateAdmin && license.verificationStatus === LicenseVerificationStatus.UNVERIFIED,
    }));
  }, [licenses, isPa, isStateAdmin]);

  const tableHeading = isPa ? 'Your licenses' : 'Licenses awaiting verification';
  const tableDescription = isPa
    ? 'View and manage your licenses. A license must be verified before it can be designated as qualifying.'
    : 'Review unverified licenses in your member state and verify them once they have been confirmed.';

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
                  onClick={() => setShowAddForm((prev) => !prev)}
                >
                  {showAddForm ? 'Cancel' : 'Add License'}
                </Button>
              )}
            </div>

            {/* {!isPa && (
              <div className="usa-alert usa-alert--info margin-bottom-2">
                <div className="usa-alert__body">
                  <p className="usa-alert__text">
                    These licenses are currently unverified. Review supporting documentation and click
                    <strong> Verify </strong>
                    once everything checks out.
                  </p>
                </div>
              </div>
            )} */}

            {showAddForm && isPa && (
              <form className="margin-y-2" onSubmit={handleSubmit(onAddLicense)}>
                <Grid row gap="md">
                  <Grid tabletLg={{ col: 6 }}>
                    <Label htmlFor="issuingStateId">Issuing State</Label>
                    <Select
                      id="issuingStateId"
                      {...register('issuingStateId')}
                      disabled={statesLoading || !memberStates.length}
                    >
                      <option value="">Select a state</option>
                      {memberStates.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.code} - {state.name}
                        </option>
                      ))}
                    </Select>
                    {errors.issuingStateId && (
                      <span className="text-red">{errors.issuingStateId.message}</span>
                    )}
                    {!statesLoading && !memberStates.length && (
                      <span className="text-red">No states available.</span>
                    )}
                  </Grid>
                  <Grid tabletLg={{ col: 6 }}>
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <TextInput id="licenseNumber" {...register('licenseNumber')} type="text" />
                    {errors.licenseNumber && (
                      <span className="text-red">{errors.licenseNumber.message}</span>
                    )}
                  </Grid>
                </Grid>
                <Grid row gap="md" className="margin-top-1">
                  <Grid tabletLg={{ col: 6 }}>
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Controller
                      control={control}
                      name="issueDate"
                      render={({ field }) => (
                        <DatePicker
                          id="issueDate"
                          name={field.name}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? '')}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    {errors.issueDate && (
                      <span className="text-red">{errors.issueDate.message}</span>
                    )}
                  </Grid>
                  <Grid tabletLg={{ col: 6 }}>
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Controller
                      control={control}
                      name="expirationDate"
                      render={({ field }) => (
                        <DatePicker
                          id="expirationDate"
                          name={field.name}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? '')}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    {errors.expirationDate && (
                      <span className="text-red">{errors.expirationDate.message}</span>
                    )}
                  </Grid>
                </Grid>
                <Grid row gap="md" className="margin-top-1">
                  <Grid tabletLg={{ col: 6 }}>
                    <Label htmlFor="selfReportedStatus">Self Reported Status</Label>
                    <Select id="selfReportedStatus" {...register('selfReportedStatus')}>
                      {selfReportedOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                    {errors.selfReportedStatus && (
                      <span className="text-red">{errors.selfReportedStatus.message}</span>
                    )}
                  </Grid>
                  <Grid tabletLg={{ col: 6 }}>
                    <Label htmlFor="evidenceUrl">Evidence URL (optional)</Label>
                    <TextInput id="evidenceUrl" type="url" {...register('evidenceUrl')} />
                    {errors.evidenceUrl && (
                      <span className="text-red">{errors.evidenceUrl.message}</span>
                    )}
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  className="margin-top-2"
                  disabled={isSubmitting || addMutation.isPending}
                >
                  Save License
                </Button>
              </form>
            )}

            <h2 className="margin-top-2">{tableHeading}</h2>
            <p className="margin-top-1">{tableDescription}</p>
            {isLoading ? (
              <p>Loading licenses…</p>
            ) : (
              <Table bordered fullWidth>
                <thead>
                  <tr>
                    {isStateAdmin && <th>Name</th>}
                    {!isStateAdmin && <th>Issuing State</th>}
                    <th>License Number</th>
                    <th>Issue Date</th>
                    <th>Expiration Date</th>
                    <th>Self Reported Status</th>
                    <th>Verification Status</th>
                    {isPa && <th>Qualifying License Status</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((license) => (
                    <tr key={license.id}>
                      {isStateAdmin && <td>{license.practitionerName}</td>}
                      {!isStateAdmin && <td>{license.issuingStateLabel}</td>}
                      <td>{license.licenseNumber}</td>
                      <td>{license.issueDateLabel}</td>
                      <td>{license.expirationDateLabel}</td>
                      <td>{license.selfReportedStatus}</td>
                      <td>{license.verificationStatus}</td>
                      {isPa && <td>{license.designationLabel}</td>}
                      <td>
                            <div className="display-flex flex-column gap-05">
                              {license.canVerify && (
                                <Button
                                  type="button"
                                  disabled={verifyMutation.isPending}
                                  onClick={() => onVerifyLicense(license.id)}
                                >
                                  Verify
                                </Button>
                              )}
                              {license.canDesignate && (
                                <ModalToggleButton
                                  modalRef={modalRef}
                                  opener
                                  type="button"
                                  secondary
                                  disabled={designateMutation.isPending}
                                  onClick={() => {
                                    setPendingDesignationId(license.id);
                                  }}
                                >
                                  Designate
                                </ModalToggleButton>
                              )}
                            </div>
                          </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={8}>No licenses found.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </main>
        </Grid>
      </GridContainer>

      <Modal ref={modalRef} id="designate-modal" aria-labelledby="designate-modal-heading" forceAction>
        <h2 id="designate-modal-heading">Confirm designation</h2>
        <p className="usa-prose">
          You can only designate one qualifying license at a time. Are you sure you want to proceed?
        </p>
        <ModalFooter>
          <Button
            type="button"
            onClick={() => {
              modalRef.current?.toggleModal();
              setPendingDesignationId(null);
            }}
            secondary
          >
            Cancel
          </Button>
          <Button type="button" onClick={confirmDesignation} disabled={designateMutation.isPending}>
            Yes, designate
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  }).format(date);
}
