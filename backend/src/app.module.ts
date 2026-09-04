import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { PropertyTypesModule } from './property-types/property-types.module';
import { LocationsModule } from './locations/locations.module';
import { ListingsModule } from './listings/listings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FavoritesModule } from './favorites/favorites.module';
import { MessagesModule } from './messages/messages.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MediaModule } from './media/media.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AgenciesModule } from './agencies/agencies.module';
import { AgentsModule } from './agents/agents.module';
import { OwnersModule } from './owners/owners.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { VisitsModule } from './visits/visits.module';
import { RentalsModule } from './rentals/rentals.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    PropertiesModule,
    PropertyTypesModule,
    LocationsModule,
    ListingsModule,
    TransactionsModule,
    FavoritesModule,
    SavedSearchesModule,
    InquiriesModule,
    VisitsModule,
    RentalsModule,
    MessagesModule,
    AppointmentsModule,
    MediaModule,
    PaymentsModule,
    NotificationsModule,
    AgenciesModule,
    AgentsModule,
    OwnersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
