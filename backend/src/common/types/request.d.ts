import { TenantContext } from '../decorators/tenant.decorator';
import { CurrentUserData } from '../decorators/current-user.decorator';

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      user?: CurrentUserData;
    }
  }
}
