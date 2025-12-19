import { type FormEvent, useMemo, useState } from 'react';
import {
  Button,
  Grid,
  GridContainer,
  Label,
  Select,
  Table,
  TextInput,
} from '@trussworks/react-uswds';

import type { PrivilegeSearchParams } from '@/shared/api/privilege-api';
import type { PrivilegeSearchResult } from '@/shared/domain/types';
import { usePrivilegeSearch } from '@/shared/hooks/privilege-queries';
import { useMemberStates } from '@/shared/hooks/member-state-queries';

export function PrivilegeSearchPage() {
  const [name, setName] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [searchParams, setSearchParams] = useState<PrivilegeSearchParams | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const { data: memberStates = [] } = useMemberStates();
  const {
    data: results = [],
    isFetching,
    isError,
    error,
  } = usePrivilegeSearch(searchParams);

  const hasSubmitted = Boolean(searchParams);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setInputError('Enter a name to search');
      return;
    }

    setInputError(null);
    setSearchParams({
      name: trimmed,
      qualifyingLicenseState: stateFilter || undefined,
    });
  }

  const formattedResults = useMemo(() => {
    return (results as PrivilegeSearchResult[]).map((result) => {
      const user = result.practitioner.user;
      const fullName = user
        ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        : 'Unknown';
      const email = user?.email ?? 'N/A';
      const licenseState =
        result.qualifyingLicense.issuingState?.code ??
        result.qualifyingLicense.issuingStateId;

      return {
        ...result,
        fullName,
        email,
        licenseState,
      };
    });
  }, [results]);

  return (
    <div className="usa-section">
      <GridContainer>
        <Grid row>
          <Grid col={12}>
            <h1>Privilege Search</h1>
            <p>Search for practitioners with a qualifying license and view their privileges.</p>

            <form className="margin-bottom-4" onSubmit={handleSubmit}>
              <Grid row gap="md">
                <Grid tablet={{ col: 6 }}>
                  <Label htmlFor="search-name">Name</Label>
                  <TextInput
                    id="search-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  {inputError && <span className="text-red">{inputError}</span>}
                </Grid>
                <Grid tablet={{ col: 4 }}>
                  <Label htmlFor="search-state">Qualifying License State (optional)</Label>
                  <Select
                    id="search-state"
                    name="state"
                    value={stateFilter}
                    onChange={(event) => setStateFilter(event.target.value)}
                  >
                    <option value="">All states</option>
                    {memberStates.map((state) => (
                      <option key={state.id} value={state.code}>
                        {state.code} - {state.name}
                      </option>
                    ))}
                  </Select>
                </Grid>
                <Grid tablet={{ col: 2 }} className="display-flex flex-align-end">
                  <Button type="submit" className="width-full">
                    Search
                  </Button>
                </Grid>
              </Grid>
            </form>

            {isFetching ? (
              <p>Searching...</p>
            ) : isError ? (
              <div className="usa-alert usa-alert--error">
                <div className="usa-alert__body">
                  <p className="usa-alert__text">
                    {(error as Error)?.message ?? 'Unable to complete search.'}
                  </p>
                </div>
              </div>
            ) : hasSubmitted ? (
              <SearchResultsTable results={formattedResults} />
            ) : (
              <p>Enter a name above to start searching.</p>
            )}
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}

type SearchResultsTableProps = {
  results: Array<PrivilegeSearchResult & { fullName: string; email: string; licenseState: string }>;
};

function SearchResultsTable({ results }: SearchResultsTableProps) {
  if (!results.length) {
    return <p>No practitioners found.</p>;
  }

  return (
    <Table fullWidth striped>
      <thead>
        <tr>
          <th scope="col">Practitioner</th>
          <th scope="col">Email</th>
          <th scope="col">Qualifying License</th>
          <th scope="col">Privileges</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => (
          <tr key={result.practitioner.id}>
            <td>{result.fullName}</td>
            <td>{result.email}</td>
            <td>
              <div>{result.qualifyingLicense.licenseNumber}</div>
              <div className="text-base">{result.licenseState}</div>
            </td>
            <td>
              {result.privileges.length === 0 ? (
                <span>No privileges</span>
              ) : (
                <ul className="usa-list usa-list--unstyled margin-0">
                  {result.privileges.map((privilege) => (
                    <li key={privilege.id}>
                      <strong>{privilege.remoteState?.code ?? privilege.remoteStateId}</strong> –{' '}
                      {privilege.status}{' '}
                      {privilege.expiresAt ? ` (expires ${formatDate(privilege.expiresAt)})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
