import { useUserContext } from '../provider/user';

export function useOrganizationById(organizationId?: string) {
  const { accounts } = useUserContext();
  const organizations = accounts.map((account) => account.organization);
  const organization = organizations.find(
    (organization) => organization.id === organizationId,
  );
  return { organization };
}
