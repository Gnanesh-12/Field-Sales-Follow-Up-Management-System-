import {
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  memoryStorage,
} from 'multer';

import {
  extname,
} from 'path';

import {
  put,
} from '@vercel/blob';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          memoryStorage(),

        fileFilter:
          (
            req,
            file,
            cb,
          ) => {
            const isImage =
              file.mimetype.match(
                /\/(jpg|jpeg|png|webp|gif)$/,
              ) ||
              file.originalname.match(
                /\.(jpg|jpeg|png|webp|gif)$/i,
              );

            if (!isImage) {
              return cb(
                new BadRequestException(
                  'Only image files are allowed',
                ),
                false,
              );
            }

            cb(
              null,
              true,
            );
          },

        limits: {
          fileSize:
            5 *
            1024 *
            1024,
        },
      },
    ),
  )
  async uploadImage(
    @Req() req: any,
    @UploadedFile()
    file: any,
  ) {
    if (!file) {
      return {
        error:
          'No file uploaded',
      };
    }

    try {
      const employeeId =
        req.user?.sub ||
        'UNKNOWN';

      const recordId =
        req.body?.recordId ||
        'NO-RECORD';

      const timestamp =
        Date.now();

      const ext =
        extname(
          file.originalname,
        );

      const filename =
        `site-photos/${employeeId}_${recordId}_${timestamp}${ext}`;

      const blob =
        await put(
          filename,
          file.buffer,
          {
            access:
              'public',

            addRandomSuffix:
              false,

            contentType:
              file.mimetype,
          },
        );

      return {
        url:
          blob.url,

        filename:
          blob.pathname,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to upload to Blob storage: ${
          error?.message ||
          error
        }`,
      );
    }
  }

  /**
   * Generic Kshetra email attachment upload.
   *
   * Supported:
   * - PDF
   * - DOC
   * - DOCX
   * - XLS
   * - XLSX
   * - JPG/JPEG
   * - PNG
   * - WEBP
   * - GIF
   *
   * Maximum:
   * 10MB per file.
   */
  @Post('attachment')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          memoryStorage(),

        fileFilter:
          (
            req,
            file,
            cb,
          ) => {
            const allowed = [
              'image/jpeg',
              'image/png',
              'image/webp',
              'image/gif',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];

            if (
              !allowed.includes(
                file.mimetype,
              )
            ) {
              return cb(
                new BadRequestException(
                  'File type is not allowed.',
                ),
                false,
              );
            }

            cb(
              null,
              true,
            );
          },

        limits: {
          fileSize:
            10 *
            1024 *
            1024,
        },
      },
    ),
  )
  async uploadAttachment(
    @Req() req: any,
    @UploadedFile()
    file: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded.',
      );
    }

    const employeeId =
      req.user?.sub ||
      req.user?.employeeId;

    if (!employeeId) {
      throw new BadRequestException(
        'Employee authentication is required.',
      );
    }

    try {
      const timestamp =
        Date.now();

      const safeName =
        file.originalname.replace(
          /[^a-zA-Z0-9._-]/g,
          '_',
        );

      const filename =
        `email-attachments/${employeeId}/${timestamp}-${safeName}`;

      const blob =
        await put(
          filename,
          file.buffer,
          {
            access:
              'public',

            addRandomSuffix:
              true,

            contentType:
              file.mimetype,
          },
        );

      return {
        url:
          blob.url,

        filename:
          file.originalname,

        contentType:
          file.mimetype,

        size:
          file.size,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to upload attachment: ${
          error?.message ||
          error
        }`,
      );
    }
  }
}