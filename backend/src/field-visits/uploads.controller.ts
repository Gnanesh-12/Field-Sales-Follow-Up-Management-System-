import { Controller, Post, UseGuards, UploadedFile, UseInterceptors, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { put } from '@vercel/blob';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.match(/\/(jpg|jpeg|png|webp)$/) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      if (!isImage) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadImage(@Req() req: any, @UploadedFile() file: any) {
    if (!file) {
      return { error: 'No file uploaded' };
    }

    try {
      const employeeId = req.user?.sub || 'UNKNOWN';
      const recordId = req.body?.recordId || 'NO-RECORD';
      const timestamp = Date.now();
      const ext = extname(file.originalname);
      const filename = `site-photos/${employeeId}_${recordId}_${timestamp}${ext}`;

      const blob = await put(filename, file.buffer, {
        access: 'public',
        addRandomSuffix: false,
      });

      return {
        url: blob.url,
        filename: blob.pathname,
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to upload to Blob storage: ${error.message}`);
    }
  }
}
