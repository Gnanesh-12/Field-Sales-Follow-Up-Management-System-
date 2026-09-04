import {
  Controller,
  Get,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeeService } from './employee.service';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { put } from '@vercel/blob';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.employeeService.getProfile(req.user.sub);
  }

  @Put('me/profile-picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        const isImage = file.mimetype.match(/\/(jpg|jpeg|png|webp|gif)$/) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        if (!isImage) {
          return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `profile-pictures/${req.user['sub']}-${uniqueSuffix}${ext}`;

      const blob = await put(filename, file.buffer, {
        access: 'public',
        addRandomSuffix: false,
      });

      const profilePictureUrl = blob.url;

      const updatedEmployee = await this.employeeService.updateProfilePicture(
        req.user.sub,
        profilePictureUrl,
      );

      return updatedEmployee;
    } catch (error: any) {
      throw new BadRequestException(`Failed to upload to Blob storage: ${error.message}`);
    }
  }
}
