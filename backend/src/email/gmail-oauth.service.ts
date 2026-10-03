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


import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, Auth } from 'googleapis';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GmailOAuthService {
  private readonly logger = new Logger(GmailOAuthService.name);
  private oauth2Client: Auth.OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (clientId && clientSecret && redirectUri) {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );
    }
  }

  getAuthUrl(employeeId: string): string {
    if (!this.oauth2Client) {
      throw new Error(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.',
      );
    }

    const scopes =
      this.configService.get<string>('GMAIL_SCOPES') ||
      'https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly';

    const stateToken = this.jwtService.sign(
      { sub: employeeId },
      { expiresIn: '15m' },
    );

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean),
      prompt: 'consent',
      state: stateToken,
    });
  }

  async handleCallback(
    code: string,
    stateToken: string,
  ): Promise<{ gmailAddress: string }> {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth is not configured.');
    }

    let employeeId: string;

    try {
      const decoded = this.jwtService.verify(stateToken);
      employeeId = decoded.sub;

      if (!employeeId) {
        throw new Error('Employee ID missing from OAuth state.');
      }
    } catch {
      throw new Error(
        'Invalid or expired OAuth state parameter. Please restart the connection process.',
      );
    }

    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error(
        'Failed to obtain OAuth tokens. Please try connecting again.',
      );
    }

    this.oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({
      version: 'v1',
      auth: this.oauth2Client,
    });

    const profile = await gmail.users.getProfile({
      userId: 'me',
    });

    const gmailAddress = profile.data.emailAddress;

    if (!gmailAddress) {
      throw new Error('Could not retrieve Gmail address from Google.');
    }

    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    const scopes =
      tokens.scope ||
      this.configService.get<string>('GMAIL_SCOPES') ||
      'https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly';

    await this.prisma.gmailConnection.upsert({
      where: {
        employeeId,
      },
      update: {
        gmailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        scopes,
        isActive: true,
        historyId: null,
        lastSyncedAt: null,
      },
      create: {
        employeeId,
        gmailAddress,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
        scopes,
        isActive: true,
      },
    });

    this.logger.log(
      `Gmail connected for employee ${employeeId}: ${gmailAddress}`,
    );

    return {
      gmailAddress,
    };
  }

  async getConnectionStatus(employeeId: string): Promise<{
    connected: boolean;
    gmailAddress?: string;
    connectedAt?: Date;
    lastSyncedAt?: Date;
  }> {
    const connection = await this.prisma.gmailConnection.findUnique({
      where: {
        employeeId,
      },
      select: {
        gmailAddress: true,
        isActive: true,
        connectedAt: true,
        lastSyncedAt: true,
      },
    });

    if (!connection || !connection.isActive) {
      return {
        connected: false,
      };
    }

    return {
      connected: true,
      gmailAddress: connection.gmailAddress,
      connectedAt: connection.connectedAt,
      lastSyncedAt: connection.lastSyncedAt ?? undefined,
    };
  }

  async disconnect(employeeId: string): Promise<void> {
    const connection = await this.prisma.gmailConnection.findUnique({
      where: {
        employeeId,
      },
    });

    if (!connection) {
      return;
    }

    try {
      if (this.oauth2Client && connection.accessToken) {
        await this.oauth2Client.revokeToken(connection.accessToken);
      }
    } catch (error) {
      this.logger.warn(
        `Token revocation failed for employee ${employeeId}: ${
          error?.message || error
        }`,
      );
    }

    await this.prisma.gmailConnection.update({
      where: {
        employeeId,
      },
      data: {
        isActive: false,
        historyId: null,
        lastSyncedAt: null,
      },
    });

    this.logger.log(`Gmail disconnected for employee ${employeeId}`);
  }

  async getAuthenticatedClient(employeeId: string): Promise<{
    client: Auth.OAuth2Client;
    gmailAddress: string;
  }> {
    const connection = await this.prisma.gmailConnection.findUnique({
      where: {
        employeeId,
      },
    });

    if (!connection || !connection.isActive) {
      throw new Error(
        'Gmail is not connected. Please connect your Gmail account first.',
      );
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Google OAuth is not configured on the server.');
    }

    const client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiry.getTime(),
    });

    const now = Date.now();
    const expiryBuffer = 5 * 60 * 1000;

    if (connection.tokenExpiry.getTime() - now < expiryBuffer) {
      try {
        const { credentials } = await client.refreshAccessToken();

        await this.prisma.gmailConnection.update({
          where: {
            employeeId,
          },
          data: {
            accessToken:
              credentials.access_token || connection.accessToken,
            tokenExpiry: credentials.expiry_date
              ? new Date(credentials.expiry_date)
              : new Date(now + 3600 * 1000),
            ...(credentials.refresh_token
              ? {
                  refreshToken: credentials.refresh_token,
                }
              : {}),
          },
        });

        client.setCredentials(credentials);

        this.logger.log(
          `Gmail token refreshed for employee ${employeeId}`,
        );
      } catch (error) {
        this.logger.error(
          `Token refresh failed for employee ${employeeId}: ${
            error?.message || error
          }`,
        );

        await this.prisma.gmailConnection.update({
          where: {
            employeeId,
          },
          data: {
            isActive: false,
          },
        });

        throw new Error(
          'Gmail authorization has expired or been revoked. Please reconnect your Gmail account.',
        );
      }
    }

    return {
      client,
      gmailAddress: connection.gmailAddress,
    };
  }
}