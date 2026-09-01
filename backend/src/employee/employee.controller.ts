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
import { diskStorage } from 'multer';
import { extname } from 'path';

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
      storage: diskStorage({
        destination: process.env.STORAGE_PATH,
        filename: (req: any, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${req.user['sub']}-${uniqueSuffix}${ext}`);
        },
      }),
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

    const profilePictureUrl = `/uploads/${file.filename}`;

    const updatedEmployee = await this.employeeService.updateProfilePicture(
      req.user.sub,
      profilePictureUrl,
    );

    return updatedEmployee;
  }
}
