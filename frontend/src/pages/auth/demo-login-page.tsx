import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Fieldset,
  Form,
  Grid,
  GridContainer,
  Label,
  Radio,
  Select,
} from '@trussworks/react-uswds';

import { useAuth } from '@/shared/hooks/auth-queries';
import type { User } from '@/shared/domain/types';
import { UserRole } from '@/shared/domain/enums';
import { useQuery } from '@tanstack/react-query';
import { getDemoUsers } from '@/shared/api/demo-api';

const demoLoginSchema = z.object({
  role: z.nativeEnum(UserRole),
  email: z.string().email('Select a valid user'),
  password: z.string().min(1),
});

type DemoLoginValues = z.infer<typeof demoLoginSchema>;

export function DemoLoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>(UserRole.PA);

  const { data: users = [] } = useQuery({
    queryKey: ['demo-users'],
    queryFn: getDemoUsers,
  });

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        role === UserRole.PA ? user.role === UserRole.PA : user.role === UserRole.STATE_ADMIN,
      ),
    [users, role],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DemoLoginValues>({
    resolver: zodResolver(demoLoginSchema),
    defaultValues: {
      role: UserRole.PA,
      email: '',
      password: 'secret123',
    },
  });

  const selectedEmail = watch('email');

  useEffect(() => {
    setValue('role', role);
  }, [role, setValue]);

  useEffect(() => {
    if (!users.length || selectedEmail) {
      return;
    }
    const defaultUser = users.find((user) => user.role === role);
    if (defaultUser) {
      setValue('email', defaultUser.email);
    }
  }, [users, role, selectedEmail, setValue]);

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    const firstUser = users.find((user) => user.role === nextRole);
    setValue('role', nextRole, { shouldValidate: true });
    setValue('email', firstUser?.email ?? '', { shouldValidate: true });
  };

  async function onSubmit(values: DemoLoginValues) {
    await login(values);
  }

  return (
    <main id="main-content">
      <GridContainer className="usa-section">
        <Grid row className="flex-justify-center">
          <Grid col={12} tablet={{ col: 8 }} desktop={{ col: 6 }}>
            <div className="bg-white padding-y-3 padding-x-5 border border-base-lighter">
              <h1 className="margin-bottom-0">Demo Login</h1>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <Fieldset legend="Select role and user" legendStyle="large">
                  <input type="hidden" {...register('role')} value={role} readOnly />
                  <input type="hidden" {...register('password')} value="secret123" readOnly />

                  <Label>Role</Label>
                  <div className="display-flex flex-row flex-gap-2 margin-bottom-2">
                    <Radio
                      id="demo-role-pa"
                      name="role"
                      value={UserRole.PA}
                      checked={role === UserRole.PA}
                      onChange={() => handleRoleChange(UserRole.PA)}
                      label="Physician Assistant"
                      className="margin-right-2 width-auto"
                    />
                    <Radio
                      id="demo-role-state"
                      name="role"
                      value={UserRole.STATE_ADMIN}
                      checked={role === UserRole.STATE_ADMIN}
                      onChange={() => handleRoleChange(UserRole.STATE_ADMIN)}
                      label="State Admin"
                      className="width-auto"
                    />
                  </div>

                  <Label htmlFor="demo-email">User</Label>
                  <Select id="demo-email" {...register('email')} disabled={!filteredUsers.length}>
                    <option value="">Select a user</option>
                    {filteredUsers.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.email}
                        {user.role === UserRole.STATE_ADMIN && user.memberState?.code
                          ? ` (${user.memberState.code})`
                          : ''}
                      </option>
                    ))}
                  </Select>
                  {errors.email && <span className="text-red">{errors.email.message}</span>}

                  <Button type="submit" className="margin-top-2" disabled={!selectedEmail}>
                    Login as selected user
                  </Button>
                </Fieldset>
              </Form>
            </div>
          </Grid>
        </Grid>
      </GridContainer>
    </main>
  );
}
