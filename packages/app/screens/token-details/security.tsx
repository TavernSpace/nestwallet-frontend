import { memo } from 'react';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';
import { SecurityReport } from '../../molecules/security';

export const SecuritySection = memo(function (props: {
  token: ICryptoBalance;
}) {
  const { token } = props;

  return <SecurityReport token={token} />;
});
