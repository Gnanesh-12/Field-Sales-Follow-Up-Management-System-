import { Controller, Post, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: process.env.STORAGE_PATH || './uploads',
      filename: (req: any, file, cb) => {
        // req.user is set by JwtAuthGuard
        const employeeId = req.user?.sub || 'UNKNOWN';
        const recordId = req.body?.recordId || 'NO-RECORD';
        const timestamp = Date.now();
        // Format: {employeeId}_{recordId}_{timestamp}.jpg
        cb(null, `${employeeId}_${recordId}_${timestamp}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.match(/\/(jpg|jpeg|png|webp)$/) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
      if (!isImage) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    };
  }
}
