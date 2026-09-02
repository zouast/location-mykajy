import { Module, forwardRef } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { AgenciesController } from './agencies.controller';
import { AdminAgenciesController } from './admin-agencies.controller';
import { AgencyAdminController } from './agency-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [
    AgenciesController,
    AdminAgenciesController,
    AgencyAdminController,
  ],
  providers: [AgenciesService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
