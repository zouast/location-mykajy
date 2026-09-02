import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuthEmailPayload {
  to: string;
  subject: string;
  body: string;
  actionUrl: string;
}

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const actionUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    await this.dispatch({
      to: email,
      subject: 'Vérifiez votre adresse email — Immo-MyKajy',
      body: 'Cliquez sur le lien pour vérifier votre compte.',
      actionUrl,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const actionUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    await this.dispatch({
      to: email,
      subject: 'Réinitialisation de mot de passe — Immo-MyKajy',
      body: 'Cliquez sur le lien pour réinitialiser votre mot de passe.',
      actionUrl,
    });
  }

  private async dispatch(payload: AuthEmailPayload): Promise<void> {
    this.logger.log(
      `[DEV] Email to ${payload.to} — ${payload.subject}\nLink: ${payload.actionUrl}`,
    );
  }
}
