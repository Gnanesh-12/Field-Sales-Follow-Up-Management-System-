// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '../prisma/prisma.service';
// import { google, Auth } from 'googleapis';
// import { JwtService } from '@nestjs/jwt';

// /**
//  * Gmail OAuth Service — handles OAuth 2.0 flow for connecting employee Gmail accounts.
//  * 
//  * SECURITY: 
//  * - OAuth client secrets remain backend-only
//  * - Refresh tokens are never sent to the frontend
//  * - Access tokens are never sent to the frontend
//  * - Employee can only access their own Gmail connection
//  */
// @Injectable()
// export class GmailOAuthService {
//   private readonly logger = new Logger(GmailOAuthService.name);
//   private oauth2Client: Auth.OAuth2Client;

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly prisma: PrismaService,
//     private readonly jwtService: JwtService,
//   ) {
//     const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
//     const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
//     const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

//     if (clientId && clientSecret && redirectUri) {
//       this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
//     }
//   }

//   /**
//    * Generate the Gmail OAuth authorization URL.
//    * Requests only gmail.send scope (Phase 1 — no inbox read).
//    */
//   getAuthUrl(employeeId: string): string {
//     if (!this.oauth2Client) {
//       throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.');
//     }

//     const scopes = this.configService.get<string>('GMAIL_SCOPES') || 'https://www.googleapis.com/auth/gmail.send';

//     const stateToken = this.jwtService.sign({ sub: employeeId }, { expiresIn: '15m' });

//     return this.oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: scopes.split(',').map(s => s.trim()),
//       prompt: 'consent',  // Always show consent to get refresh token
//       state: stateToken,  // Securely pass employee ID through signed OAuth state parameter
//     });
//   }

//   /**
//    * Handle the OAuth callback — exchange code for tokens and store them.
//    */
//   async handleCallback(code: string, stateToken: string): Promise<{ gmailAddress: string }> {
//     if (!this.oauth2Client) {
//       throw new Error('Google OAuth is not configured.');
//     }

//     let employeeId: string;
//     try {
//       const decoded = this.jwtService.verify(stateToken);
//       employeeId = decoded.sub;
//     } catch (err) {
//       throw new Error('Invalid or expired OAuth state parameter. Please restart the connection process.');
//     }

//     // Exchange authorization code for tokens
//     const { tokens } = await this.oauth2Client.getToken(code);

//     if (!tokens.access_token || !tokens.refresh_token) {
//       throw new Error('Failed to obtain OAuth tokens. Please try connecting again.');
//     }

//     // Get the Gmail address from the token info
//     this.oauth2Client.setCredentials(tokens);
//     const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
//     const profile = await gmail.users.getProfile({ userId: 'me' });
//     const gmailAddress = profile.data.emailAddress;

//     if (!gmailAddress) {
//       throw new Error('Could not retrieve Gmail address from Google.');
//     }

//     const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);
//     const scopes = tokens.scope || 'https://www.googleapis.com/auth/gmail.send';

//     // Upsert the Gmail connection (one per employee)
//     await this.prisma.gmailConnection.upsert({
//       where: { employeeId },
//       update: {
//         gmailAddress,
//         accessToken: tokens.access_token,
//         refreshToken: tokens.refresh_token,
//         tokenExpiry,
//         scopes,
//         isActive: true,
//       },
//       create: {
//         employeeId,
//         gmailAddress,
//         accessToken: tokens.access_token,
//         refreshToken: tokens.refresh_token,
//         tokenExpiry,
//         scopes,
//         isActive: true,
//       },
//     });

//     this.logger.log(`Gmail connected for employee ${employeeId}: ${gmailAddress}`);

//     return { gmailAddress };
//   }

//   /**
//    * Get the connection status for an employee (safe for frontend — no tokens exposed).
//    */
//   async getConnectionStatus(employeeId: string): Promise<{
//     connected: boolean;
//     gmailAddress?: string;
//     connectedAt?: Date;
//   }> {
//     const connection = await this.prisma.gmailConnection.findUnique({
//       where: { employeeId },
//       select: {
//         gmailAddress: true,
//         isActive: true,
//         connectedAt: true,
//       },
//     });

//     if (!connection || !connection.isActive) {
//       return { connected: false };
//     }

//     return {
//       connected: true,
//       gmailAddress: connection.gmailAddress,
//       connectedAt: connection.connectedAt,
//     };
//   }

//   /**
//    * Disconnect Gmail — revoke tokens and deactivate connection.
//    */
//   async disconnect(employeeId: string): Promise<void> {
//     const connection = await this.prisma.gmailConnection.findUnique({
//       where: { employeeId },
//     });

//     if (!connection) {
//       return; // Already disconnected — no-op
//     }

//     // Attempt to revoke the token with Google
//     try {
//       if (this.oauth2Client && connection.accessToken) {
//         await this.oauth2Client.revokeToken(connection.accessToken);
//       }
//     } catch (error) {
//       // Token may already be revoked — log and continue
//       this.logger.warn(`Token revocation failed for employee ${employeeId}: ${error.message}`);
//     }

//     // Deactivate the connection (soft delete — keeps audit trail)
//     await this.prisma.gmailConnection.update({
//       where: { employeeId },
//       data: { isActive: false },
//     });

//     this.logger.log(`Gmail disconnected for employee ${employeeId}`);
//   }

//   /**
//    * Get a valid OAuth2 client with fresh tokens for an employee.
//    * Handles automatic token refresh.
//    * 
//    * SECURITY: This is internal only — never expose the returned client or tokens.
//    */
//   async getAuthenticatedClient(employeeId: string): Promise<{
//     client: Auth.OAuth2Client;
//     gmailAddress: string;
//   }> {
//     const connection = await this.prisma.gmailConnection.findUnique({
//       where: { employeeId },
//     });

//     if (!connection || !connection.isActive) {
//       throw new Error('Gmail is not connected. Please connect your Gmail account first.');
//     }

//     if (!this.oauth2Client) {
//       throw new Error('Google OAuth is not configured on the server.');
//     }

//     // Create a new OAuth2 client instance for this request
//     const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
//     const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
//     const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
//     const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

//     client.setCredentials({
//       access_token: connection.accessToken,
//       refresh_token: connection.refreshToken,
//       expiry_date: connection.tokenExpiry.getTime(),
//     });

//     // Check if token needs refresh
//     const now = Date.now();
//     const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

//     if (connection.tokenExpiry.getTime() - now < expiryBuffer) {
//       try {
//         const { credentials } = await client.refreshAccessToken();

//         // Update stored tokens
//         await this.prisma.gmailConnection.update({
//           where: { employeeId },
//           data: {
//             accessToken: credentials.access_token!,
//             tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(now + 3600 * 1000),
//             ...(credentials.refresh_token ? { refreshToken: credentials.refresh_token } : {}),
//           },
//         });

//         client.setCredentials(credentials);
//         this.logger.log(`Token refreshed for employee ${employeeId}`);
//       } catch (error) {
//         // Token refresh failed — mark connection as inactive
//         this.logger.error(`Token refresh failed for employee ${employeeId}: ${error.message}`);
//         await this.prisma.gmailConnection.update({
//           where: { employeeId },
//           data: { isActive: false },
//         });
//         throw new Error('Gmail authorization has expired or been revoked. Please reconnect your Gmail account.');
//       }
//     }

//     return { client, gmailAddress: connection.gmailAddress };
//   }
// }


// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { PrismaService } from '../prisma/prisma.service';
// import { google, Auth } from 'googleapis';
// import { JwtService } from '@nestjs/jwt';

// @Injectable()
// export class GmailOAuthService {
//   private readonly logger = new Logger(GmailOAuthService.name);
//   private oauth2Client: Auth.OAuth2Client;

//   constructor(
//     private readonly configService: ConfigService,
//     private readonly prisma: PrismaService,
//     private readonly jwtService: JwtService,
//   ) {
//     const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
//     const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
//     const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

//     if (clientId && clientSecret && redirectUri) {
//       this.oauth2Client = new google.auth.OAuth2(
//         clientId,
//         clientSecret,
//         redirectUri,
//       );
//     }
//   }

//   getAuthUrl(employeeId: string): string {
//     if (!this.oauth2Client) {
//       throw new Error(
//         'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.',
//       );
//     }

//     const scopes =
//       this.configService.get<string>('GMAIL_SCOPES') ||
//       'https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly';

//     const stateToken = this.jwtService.sign(
//       { sub: employeeId },
//       { expiresIn: '15m' },
//     );

//     return this.oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: scopes
//         .split(',')
//         .map((scope) => scope.trim())
//         .filter(Boolean),
//       prompt: 'consent',
//       state: stateToken,
//     });
//   }

//   async handleCallback(
//     code: string,
//     stateToken: string,
//   ): Promise<{ gmailAddress: string }> {
//     if (!this.oauth2Client) {
//       throw new Error('Google OAuth is not configured.');
//     }

//     let employeeId: string;

//     try {
//       const decoded = this.jwtService.verify(stateToken);
//       employeeId = decoded.sub;

//       if (!employeeId) {
//         throw new Error('Employee ID missing from OAuth state.');
//       }
//     } catch {
//       throw new Error(
//         'Invalid or expired OAuth state parameter. Please restart the connection process.',
//       );
//     }

//     const { tokens } = await this.oauth2Client.getToken(code);

//     if (!tokens.access_token || !tokens.refresh_token) {
//       throw new Error(
//         'Failed to obtain OAuth tokens. Please try connecting again.',
//       );
//     }

//     this.oauth2Client.setCredentials(tokens);
//     const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
//     const profile = await oauth2.userinfo.get();
//     const gmailAddress = profile.data.email;

//     if (!gmailAddress) {
//       throw new Error('Could not retrieve Gmail address from Google.');
//     }

//     const tokenExpiry = tokens.expiry_date
//       ? new Date(tokens.expiry_date)
//       : new Date(Date.now() + 3600 * 1000);

//     const scopes =
//       tokens.scope ||
//       this.configService.get<string>('GMAIL_SCOPES') ||
//       'https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly';

//     await this.prisma.gmailConnection.upsert({
//       where: {
//         employeeId,
//       },
//       update: {
//         gmailAddress,
//         accessToken: tokens.access_token,
//         refreshToken: tokens.refresh_token,
//         tokenExpiry,
//         scopes,
//         isActive: true,
//         historyId: null,
//         lastSyncedAt: null,
//       },
//       create: {
//         employeeId,
//         gmailAddress,
//         accessToken: tokens.access_token,
//         refreshToken: tokens.refresh_token,
//         tokenExpiry,
//         scopes,
//         isActive: true,
//       },
//     });

//     this.logger.log(
//       `Gmail connected for employee ${employeeId}: ${gmailAddress}`,
//     );

//     return {
//       gmailAddress,
//     };
//   }

//   async getConnectionStatus(employeeId: string): Promise<{
//     connected: boolean;
//     gmailAddress?: string;
//     connectedAt?: Date;
//     lastSyncedAt?: Date;
//   }> {
//     const connection = await this.prisma.gmailConnection.findUnique({
//       where: {
//         employeeId,
//       },
//       select: {
//         gmailAddress: true,
//         isActive: true,
//         connectedAt: true,
//         lastSyncedAt: true,
//       },
//     });

//     if (!connection || !connection.isActive) {
//       return {
//         connected: false,
//       };
//     }

//     return {
//       connected: true,
//       gmailAddress: connection.gmailAddress,
//       connectedAt: connection.connectedAt,
//       lastSyncedAt: connection.lastSyncedAt ?? undefined,
//     };
//   }

//   async disconnect(employeeId: string): Promise<void> {
//     const connection = await this.prisma.gmailConnection.findUnique({
//       where: {
//         employeeId,
//       },
//     });

//     if (!connection) {
//       return;
//     }

//     try {
//       if (this.oauth2Client && connection.accessToken) {
//         await this.oauth2Client.revokeToken(connection.accessToken);
//       }
//     } catch (error) {
//       this.logger.warn(
//         `Token revocation failed for employee ${employeeId}: ${error?.message || error
//         }`,
//       );
//     }

//     await this.prisma.gmailConnection.update({
//       where: {
//         employeeId,
//       },
//       data: {
//         isActive: false,
//         historyId: null,
//         lastSyncedAt: null,
//       },
//     });

//     this.logger.log(`Gmail disconnected for employee ${employeeId}`);
//   }

//   async getAuthenticatedClient(employeeId: string): Promise<{
//     client: Auth.OAuth2Client;
//     gmailAddress: string;
//   }> {
//     const connection = await this.prisma.gmailConnection.findUnique({
//       where: {
//         employeeId,
//       },
//     });

//     if (!connection || !connection.isActive) {
//       throw new Error(
//         'Gmail is not connected. Please connect your Gmail account first.',
//       );
//     }

//     const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
//     const clientSecret =
//       this.configService.get<string>('GOOGLE_CLIENT_SECRET');
//     const redirectUri =
//       this.configService.get<string>('GOOGLE_REDIRECT_URI');

//     if (!clientId || !clientSecret || !redirectUri) {
//       throw new Error('Google OAuth is not configured on the server.');
//     }

//     const client = new google.auth.OAuth2(
//       clientId,
//       clientSecret,
//       redirectUri,
//     );

//     client.setCredentials({
//       access_token: connection.accessToken,
//       refresh_token: connection.refreshToken,
//       expiry_date: connection.tokenExpiry.getTime(),
//     });

//     const now = Date.now();
//     const expiryBuffer = 5 * 60 * 1000;

//     if (connection.tokenExpiry.getTime() - now < expiryBuffer) {
//       try {
//         const { credentials } = await client.refreshAccessToken();

//         await this.prisma.gmailConnection.update({
//           where: {
//             employeeId,
//           },
//           data: {
//             accessToken:
//               credentials.access_token || connection.accessToken,
//             tokenExpiry: credentials.expiry_date
//               ? new Date(credentials.expiry_date)
//               : new Date(now + 3600 * 1000),
//             ...(credentials.refresh_token
//               ? {
//                 refreshToken: credentials.refresh_token,
//               }
//               : {}),
//           },
//         });

//         client.setCredentials(credentials);

//         this.logger.log(
//           `Gmail token refreshed for employee ${employeeId}`,
//         );
//       } catch (error) {
//         this.logger.error(
//           `Token refresh failed for employee ${employeeId}: ${error?.message || error
//           }`,
//         );

//         await this.prisma.gmailConnection.update({
//           where: {
//             employeeId,
//           },
//           data: {
//             isActive: false,
//           },
//         });

//         throw new Error(
//           'Gmail authorization has expired or been revoked. Please reconnect your Gmail account.',
//         );
//       }
//     }

//     return {
//       client,
//       gmailAddress: connection.gmailAddress,
//     };
//   }
// }

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';

import {
  google,
  Auth,
} from 'googleapis';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GmailOAuthService {
  private readonly logger =
    new Logger(GmailOAuthService.name);

  private oauth2Client?: Auth.OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const clientId =
      this.configService.get<string>(
        'GOOGLE_CLIENT_ID',
      );

    const clientSecret =
      this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );

    const redirectUri =
      this.configService.get<string>(
        'GOOGLE_REDIRECT_URI',
      );

    if (
      clientId &&
      clientSecret &&
      redirectUri
    ) {
      this.oauth2Client =
        new google.auth.OAuth2(
          clientId,
          clientSecret,
          redirectUri,
        );
    }
  }

  // ============================================================
  // COMMON
  // ============================================================

  private getScopes(): string[] {
    const scopes =
      this.configService.get<string>(
        'GMAIL_SCOPES',
      ) ||
      [
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send',
      ].join(',');

    return scopes
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  private createOAuthClient(): Auth.OAuth2Client {
    const clientId =
      this.configService.get<string>(
        'GOOGLE_CLIENT_ID',
      );

    const clientSecret =
      this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );

    const redirectUri =
      this.configService.get<string>(
        'GOOGLE_REDIRECT_URI',
      );

    if (
      !clientId ||
      !clientSecret ||
      !redirectUri
    ) {
      throw new Error(
        'Google OAuth is not configured on the server.',
      );
    }

    return new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  private ensureConfigured(): void {
    if (!this.oauth2Client) {
      throw new Error(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.',
      );
    }
  }

  // ============================================================
  // EMPLOYEE GMAIL
  // ============================================================

  getAuthUrl(
    employeeId: string,
  ): string {
    this.ensureConfigured();

    const stateToken =
      this.jwtService.sign(
        {
          sub: employeeId,
          type: 'employee',
        },
        {
          expiresIn: '15m',
        },
      );

    return this.oauth2Client!.generateAuthUrl(
      {
        access_type: 'offline',
        scope: this.getScopes(),
        prompt: 'consent',
        state: stateToken,
      },
    );
  }

  // ============================================================
  // ADMIN GMAIL
  // ============================================================

  getAdminAuthUrl(
    adminId: string,
  ): string {
    this.ensureConfigured();

    const stateToken =
      this.jwtService.sign(
        {
          sub: adminId,
          type: 'admin',
        },
        {
          expiresIn: '15m',
        },
      );

    return this.oauth2Client!.generateAuthUrl(
      {
        access_type: 'offline',
        scope: this.getScopes(),
        prompt: 'consent',
        state: stateToken,
      },
    );
  }

  // ============================================================
  // SHARED CALLBACK
  // ============================================================

  async handleCallback(
    code: string,
    stateToken: string,
  ): Promise<{
    gmailAddress: string;
    accountType: 'employee' | 'admin';
  }> {
    this.ensureConfigured();

    let decoded: any;

    try {
      decoded =
        this.jwtService.verify(
          stateToken,
        );
    } catch {
      throw new Error(
        'Invalid or expired OAuth state parameter. Please restart the connection process.',
      );
    }

    const userId =
      decoded?.sub;

    const accountType =
      decoded?.type === 'admin'
        ? 'admin'
        : 'employee';

    if (!userId) {
      throw new Error(
        'Invalid OAuth state. Account ID is missing.',
      );
    }

    const { tokens } =
      await this.oauth2Client!.getToken(
        code,
      );

    if (
      !tokens.access_token ||
      !tokens.refresh_token
    ) {
      throw new Error(
        'Failed to obtain OAuth tokens. Please try connecting again.',
      );
    }

    const callbackClient =
      this.createOAuthClient();

    callbackClient.setCredentials(
      tokens,
    );

    const oauth2 =
      google.oauth2({
        version: 'v2',
        auth: callbackClient,
      });

    const profile =
      await oauth2.userinfo.get();

    const gmailAddress =
      profile.data.email;

    if (!gmailAddress) {
      throw new Error(
        'Could not retrieve Gmail address from Google.',
      );
    }

    const tokenExpiry =
      tokens.expiry_date
        ? new Date(
            tokens.expiry_date,
          )
        : new Date(
            Date.now() +
              3600 * 1000,
          );

    const scopes =
      tokens.scope ||
      this.getScopes().join(',');

    if (
      accountType === 'admin'
    ) {
      const admin =
        await this.prisma.admin.findUnique(
          {
            where: {
              id: userId,
            },
          },
        );

      if (!admin) {
        throw new Error(
          'Admin account not found.',
        );
      }

      await this.prisma.adminGmailConnection.upsert(
        {
          where: {
            adminId: userId,
          },
          update: {
            gmailAddress,
            accessToken:
              tokens.access_token,
            refreshToken:
              tokens.refresh_token,
            tokenExpiry,
            scopes,
            isActive: true,
            historyId: null,
            lastSyncedAt: null,
          },
          create: {
            adminId: userId,
            gmailAddress,
            accessToken:
              tokens.access_token,
            refreshToken:
              tokens.refresh_token,
            tokenExpiry,
            scopes,
            isActive: true,
          },
        },
      );

      this.logger.log(
        `Admin Gmail connected: ${userId} -> ${gmailAddress}`,
      );

      return {
        gmailAddress,
        accountType: 'admin',
      };
    }

    const employee =
      await this.prisma.employee.findUnique(
        {
          where: {
            id: userId,
          },
        },
      );

    if (!employee) {
      throw new Error(
        'Employee account not found.',
      );
    }

    await this.prisma.gmailConnection.upsert(
      {
        where: {
          employeeId: userId,
        },
        update: {
          gmailAddress,
          accessToken:
            tokens.access_token,
          refreshToken:
            tokens.refresh_token,
          tokenExpiry,
          scopes,
          isActive: true,
          historyId: null,
          lastSyncedAt: null,
        },
        create: {
          employeeId: userId,
          gmailAddress,
          accessToken:
            tokens.access_token,
          refreshToken:
            tokens.refresh_token,
          tokenExpiry,
          scopes,
          isActive: true,
        },
      },
    );

    this.logger.log(
      `Employee Gmail connected: ${userId} -> ${gmailAddress}`,
    );

    return {
      gmailAddress,
      accountType: 'employee',
    };
  }

  // ============================================================
  // EMPLOYEE STATUS
  // ============================================================

  async getConnectionStatus(
    employeeId: string,
  ) {
    const connection =
      await this.prisma.gmailConnection.findUnique(
        {
          where: {
            employeeId,
          },
          select: {
            gmailAddress: true,
            isActive: true,
            connectedAt: true,
            lastSyncedAt: true,
          },
        },
      );

    if (
      !connection ||
      !connection.isActive
    ) {
      return {
        connected: false,
      };
    }

    return {
      connected: true,
      gmailAddress:
        connection.gmailAddress,
      connectedAt:
        connection.connectedAt,
      lastSyncedAt:
        connection.lastSyncedAt ??
        undefined,
    };
  }

  async disconnect(
    employeeId: string,
  ): Promise<void> {
    const connection =
      await this.prisma.gmailConnection.findUnique(
        {
          where: {
            employeeId,
          },
        },
      );

    if (!connection) {
      return;
    }

    try {
      const client =
        this.createOAuthClient();

      if (connection.accessToken) {
        await client.revokeToken(
          connection.accessToken,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Employee Gmail token revoke failed: ${error?.message || error}`,
      );
    }

    await this.prisma.gmailConnection.update(
      {
        where: {
          employeeId,
        },
        data: {
          isActive: false,
          historyId: null,
          lastSyncedAt: null,
        },
      },
    );
  }

  async getAuthenticatedClient(
    employeeId: string,
  ): Promise<{
    client: Auth.OAuth2Client;
    gmailAddress: string;
  }> {
    const connection =
      await this.prisma.gmailConnection.findUnique(
        {
          where: {
            employeeId,
          },
        },
      );

    if (
      !connection ||
      !connection.isActive
    ) {
      throw new Error(
        'Gmail is not connected. Please connect your Gmail account first.',
      );
    }

    const client =
      await this.refreshEmployeeTokenIfNeeded(
        connection,
      );

    return {
      client,
      gmailAddress:
        connection.gmailAddress,
    };
  }

  // ============================================================
  // ADMIN STATUS
  // ============================================================

  async getAdminConnectionStatus(
    adminId: string,
  ) {
    const connection =
      await this.prisma.adminGmailConnection.findUnique(
        {
          where: {
            adminId,
          },
          select: {
            gmailAddress: true,
            isActive: true,
            connectedAt: true,
            lastSyncedAt: true,
          },
        },
      );

    if (
      !connection ||
      !connection.isActive
    ) {
      return {
        connected: false,
      };
    }

    return {
      connected: true,
      gmailAddress:
        connection.gmailAddress,
      connectedAt:
        connection.connectedAt,
      lastSyncedAt:
        connection.lastSyncedAt ??
        undefined,
    };
  }

  async disconnectAdmin(
    adminId: string,
  ): Promise<void> {
    const connection =
      await this.prisma.adminGmailConnection.findUnique(
        {
          where: {
            adminId,
          },
        },
      );

    if (!connection) {
      return;
    }

    try {
      const client =
        this.createOAuthClient();

      if (connection.accessToken) {
        await client.revokeToken(
          connection.accessToken,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Admin Gmail token revoke failed: ${error?.message || error}`,
      );
    }

    await this.prisma.adminGmailConnection.update(
      {
        where: {
          adminId,
        },
        data: {
          isActive: false,
          historyId: null,
          lastSyncedAt: null,
        },
      },
    );
  }

  async getAdminAuthenticatedClient(
    adminId: string,
  ): Promise<{
    client: Auth.OAuth2Client;
    gmailAddress: string;
  }> {
    const connection =
      await this.prisma.adminGmailConnection.findUnique(
        {
          where: {
            adminId,
          },
        },
      );

    if (
      !connection ||
      !connection.isActive
    ) {
      throw new Error(
        'Admin Gmail is not connected.',
      );
    }

    const client =
      this.createOAuthClient();

    client.setCredentials({
      access_token:
        connection.accessToken,
      refresh_token:
        connection.refreshToken,
      expiry_date:
        connection.tokenExpiry.getTime(),
    });

    const now =
      Date.now();

    const expiryBuffer =
      5 * 60 * 1000;

    if (
      connection.tokenExpiry.getTime() -
        now <
      expiryBuffer
    ) {
      try {
        const { credentials } =
          await client.refreshAccessToken();

        await this.prisma.adminGmailConnection.update(
          {
            where: {
              adminId,
            },
            data: {
              accessToken:
                credentials.access_token ||
                connection.accessToken,
              tokenExpiry:
                credentials.expiry_date
                  ? new Date(
                      credentials.expiry_date,
                    )
                  : new Date(
                      now +
                        3600 *
                          1000,
                    ),
              ...(credentials.refresh_token
                ? {
                    refreshToken:
                      credentials.refresh_token,
                  }
                : {}),
            },
          },
        );

        client.setCredentials(
          credentials,
        );
      } catch (error) {
        await this.prisma.adminGmailConnection.update(
          {
            where: {
              adminId,
            },
            data: {
              isActive: false,
            },
          },
        );

        throw new Error(
          'Admin Gmail authorization has expired or been revoked. Please reconnect Gmail.',
        );
      }
    }

    return {
      client,
      gmailAddress:
        connection.gmailAddress,
    };
  }

  // ============================================================
  // TOKEN REFRESH
  // ============================================================

  private async refreshEmployeeTokenIfNeeded(
    connection: any,
  ): Promise<Auth.OAuth2Client> {
    const client =
      this.createOAuthClient();

    client.setCredentials({
      access_token:
        connection.accessToken,
      refresh_token:
        connection.refreshToken,
      expiry_date:
        connection.tokenExpiry.getTime(),
    });

    const now =
      Date.now();

    const expiryBuffer =
      5 * 60 * 1000;

    if (
      connection.tokenExpiry.getTime() -
        now <
      expiryBuffer
    ) {
      try {
        const { credentials } =
          await client.refreshAccessToken();

        await this.prisma.gmailConnection.update(
          {
            where: {
              employeeId:
                connection.employeeId,
            },
            data: {
              accessToken:
                credentials.access_token ||
                connection.accessToken,
              tokenExpiry:
                credentials.expiry_date
                  ? new Date(
                      credentials.expiry_date,
                    )
                  : new Date(
                      now +
                        3600 *
                          1000,
                    ),
              ...(credentials.refresh_token
                ? {
                    refreshToken:
                      credentials.refresh_token,
                  }
                : {}),
            },
          },
        );

        client.setCredentials(
          credentials,
        );
      } catch (error) {
        await this.prisma.gmailConnection.update(
          {
            where: {
              employeeId:
                connection.employeeId,
            },
            data: {
              isActive: false,
            },
          },
        );

        throw new Error(
          'Gmail authorization has expired or been revoked. Please reconnect your Gmail account.',
        );
      }
    }

    return client;
  }
}