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

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

@Injectable()
export class GmailOAuthService {
  private readonly logger =
    new Logger(
      GmailOAuthService.name,
    );

  private oauth2Client:
    Auth.OAuth2Client | null = null;

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

  getAuthUrl(
    employeeId: string,
  ): string {
    if (!this.oauth2Client) {
      throw new Error(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.',
      );
    }

    const scopes =
      this.configService.get<string>(
        'GMAIL_SCOPES',
      ) ||
      [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ].join(',');

    const stateToken =
      this.jwtService.sign(
        {
          sub:
            employeeId,
        },
        {
          expiresIn:
            '15m',
        },
      );

    return this.oauth2Client.generateAuthUrl(
      {
        access_type:
          'offline',

        scope:
          scopes
            .split(',')
            .map(
              (scope) =>
                scope.trim(),
            )
            .filter(Boolean),

        prompt:
          'consent',

        state:
          stateToken,
      },
    );
  }

  async handleCallback(
    code: string,
    stateToken: string,
  ): Promise<{
    gmailAddress: string;
  }> {
    if (!this.oauth2Client) {
      throw new Error(
        'Google OAuth is not configured.',
      );
    }

    let employeeId: string;

    try {
      const decoded =
        this.jwtService.verify(
          stateToken,
        );

      employeeId =
        decoded.sub;

      if (!employeeId) {
        throw new Error(
          'Employee ID missing from OAuth state.',
        );
      }
    } catch {
      throw new Error(
        'Invalid or expired OAuth state parameter. Please restart the connection process.',
      );
    }

    const { tokens } =
      await this.oauth2Client.getToken(
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

    this.oauth2Client.setCredentials(
      tokens,
    );

    const oauth2 =
      google.oauth2({
        version:
          'v2',

        auth:
          this.oauth2Client,
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
              3600 *
                1000,
          );

    const scopes =
      tokens.scope ||
      this.configService.get<string>(
        'GMAIL_SCOPES',
      ) ||
      [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ].join(',');

    await this.prisma.gmailConnection.upsert(
      {
        where: {
          employeeId,
        },

        update: {
          gmailAddress,

          accessToken:
            this.encryptToken(
              tokens.access_token,
            ),

          refreshToken:
            this.encryptToken(
              tokens.refresh_token,
            ),

          tokenExpiry,

          scopes,

          isActive:
            true,

          historyId:
            null,

          lastSyncedAt:
            null,
        },

        create: {
          employeeId,

          gmailAddress,

          accessToken:
            this.encryptToken(
              tokens.access_token,
            ),

          refreshToken:
            this.encryptToken(
              tokens.refresh_token,
            ),

          tokenExpiry,

          scopes,

          isActive:
            true,
        },
      },
    );

    this.logger.log(
      `Gmail connected for employee ${employeeId}: ${gmailAddress}`,
    );

    return {
      gmailAddress,
    };
  }

  async getConnectionStatus(
    employeeId: string,
  ): Promise<{
    connected: boolean;
    gmailAddress?: string;
    connectedAt?: Date;
    lastSyncedAt?: Date;
  }> {
    const connection =
      await this.prisma.gmailConnection.findUnique(
        {
          where: {
            employeeId,
          },

          select: {
            gmailAddress:
              true,

            isActive:
              true,

            connectedAt:
              true,

            lastSyncedAt:
              true,
          },
        },
      );

    if (
      !connection ||
      !connection.isActive
    ) {
      return {
        connected:
          false,
      };
    }

    return {
      connected:
        true,

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
      if (
        this.oauth2Client &&
        connection.accessToken
      ) {
        await this.oauth2Client.revokeToken(
          this.decryptToken(
            connection.accessToken,
          ),
        );
      }
    } catch (error: any) {
      this.logger.warn(
        `Token revocation failed for employee ${employeeId}: ${
          error?.message ||
          error
        }`,
      );
    }

    await this.prisma.gmailConnection.update(
      {
        where: {
          employeeId,
        },

        data: {
          isActive:
            false,

          historyId:
            null,

          lastSyncedAt:
            null,
        },
      },
    );

    this.logger.log(
      `Gmail disconnected for employee ${employeeId}`,
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

    /*
     * Existing connections may contain plaintext tokens from
     * before encryption was added.
     *
     * decryptToken() intentionally returns plaintext unchanged
     * when the value doesn't start with enc:v1.
     */
    const accessToken =
      this.decryptToken(
        connection.accessToken,
      );

    const refreshToken =
      this.decryptToken(
        connection.refreshToken,
      );

    const client =
      new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );

    client.setCredentials({
      access_token:
        accessToken,

      refresh_token:
        refreshToken,

      expiry_date:
        connection.tokenExpiry.getTime(),
    });

    /*
     * Migrate legacy plaintext tokens to encrypted storage.
     */
    const accessWasLegacy =
      !connection.accessToken.startsWith(
        'enc:v1:',
      );

    const refreshWasLegacy =
      !connection.refreshToken.startsWith(
        'enc:v1:',
      );

    if (
      accessWasLegacy ||
      refreshWasLegacy
    ) {
      await this.prisma.gmailConnection.update(
        {
          where: {
            employeeId,
          },

          data: {
            accessToken:
              this.encryptToken(
                accessToken,
              ),

            refreshToken:
              this.encryptToken(
                refreshToken,
              ),
          },
        },
      );

      this.logger.log(
        `Migrated legacy Gmail tokens to encrypted storage for employee ${employeeId}`,
      );
    }

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
        const {
          credentials,
        } =
          await client.refreshAccessToken();

        const newAccessToken =
          credentials.access_token ||
          accessToken;

        const newRefreshToken =
          credentials.refresh_token ||
          refreshToken;

        await this.prisma.gmailConnection.update(
          {
            where: {
              employeeId,
            },

            data: {
              accessToken:
                this.encryptToken(
                  newAccessToken,
                ),

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

              refreshToken:
                this.encryptToken(
                  newRefreshToken,
                ),
            },
          },
        );

        client.setCredentials(
          {
            ...credentials,

            access_token:
              newAccessToken,

            refresh_token:
              newRefreshToken,
          },
        );

        this.logger.log(
          `Gmail token refreshed for employee ${employeeId}`,
        );
      } catch (error: any) {
        this.logger.error(
          `Token refresh failed for employee ${employeeId}: ${
            error?.message ||
            error
          }`,
        );

        await this.prisma.gmailConnection.update(
          {
            where: {
              employeeId,
            },

            data: {
              isActive:
                false,
            },
          },
        );

        throw new Error(
          'Gmail authorization has expired or been revoked. Please reconnect your Gmail account.',
        );
      }
    }

    return {
      client,

      gmailAddress:
        connection.gmailAddress,
    };
  }

  private getTokenEncryptionKey(): Buffer {
    const configured =
      this.configService.get<string>(
        'GMAIL_TOKEN_ENCRYPTION_KEY',
      );

    if (!configured) {
      throw new Error(
        'GMAIL_TOKEN_ENCRYPTION_KEY is not configured.',
      );
    }

    if (
      /^[0-9a-fA-F]{64}$/.test(
        configured,
      )
    ) {
      return Buffer.from(
        configured,
        'hex',
      );
    }

    try {
      const base64 =
        Buffer.from(
          configured,
          'base64',
        );

      if (
        base64.length ===
        32
      ) {
        return base64;
      }
    } catch {
      // Continue to validation error below.
    }

    throw new Error(
      'GMAIL_TOKEN_ENCRYPTION_KEY must be a 32-byte hex or base64 key.',
    );
  }

  private encryptToken(token: string): string {
    const key = this.getTokenEncryptionKey();

    const iv = randomBytes(12);

    const cipher = createCipheriv(
      'aes-256-gcm',
      key,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      'enc',
      'v1',
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('base64'),
    ].join(':');
  }

  private decryptToken(value: string): string {
    if (!value) {
      throw new Error(
        'Gmail token is empty.',
      );
    }

    // Legacy plaintext token.
    if (!value.startsWith('enc:v1:')) {
      return value;
    }

    const parts = value.split(':');

    /*
    * Expected:
    *
    * [0] enc
    * [1] v1
    * [2] IV
    * [3] authentication tag
    * [4] encrypted payload
    */
    if (parts.length !== 5) {
      throw new Error(
        'Invalid encrypted Gmail token.',
      );
    }

    const [
      prefix,
      version,
      ivHex,
      authTagHex,
      encryptedBase64,
    ] = parts;

    if (
      prefix !== 'enc' ||
      version !== 'v1'
    ) {
      throw new Error(
        'Invalid encrypted Gmail token.',
      );
    }

    const iv = Buffer.from(
      ivHex,
      'hex',
    );

    const authTag = Buffer.from(
      authTagHex,
      'hex',
    );

    const encrypted = Buffer.from(
      encryptedBase64,
      'base64',
    );

    if (iv.length !== 12) {
      throw new Error(
        'Invalid encrypted Gmail token: invalid IV.',
      );
    }

    if (authTag.length !== 16) {
      throw new Error(
        'Invalid encrypted Gmail token: invalid authentication tag.',
      );
    }

    if (encrypted.length === 0) {
      throw new Error(
        'Invalid encrypted Gmail token: empty payload.',
      );
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getTokenEncryptionKey(),
      iv,
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}