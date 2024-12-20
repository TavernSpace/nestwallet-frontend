import { IS_PRODUCTION } from '../../common/api/nestwallet/utils';
import { IUser } from '../../graphql/client/generated/graphql';

export function hasBetaAccess(user: IUser) {
  return IS_PRODUCTION ? user.betaAccess : true;
}
