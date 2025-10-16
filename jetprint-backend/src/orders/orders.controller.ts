import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Patch,
  Delete,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateNotesDto } from './dto/update-notes.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from '@prisma/client';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedRequest extends Request {
  user: User;
}

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  // ✅ FIX: Pass the *injected* configService from the constructor to the factory.
  @UseInterceptors(FilesInterceptor('files', 20, multerConfig(new ConfigService())))
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: AuthenticatedRequest,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.ordersService.create(createOrderDto, req.user, files);
  }

  @Get()
  findAllAvailable(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAllAvailable(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get(':id/confirmation-message')
  generateConfirmationMessage(@Param('id') id: string) {
    return this.ordersService.generateConfirmationMessage(id);
  }

  @Patch(':id/shipping')
  updateShippingPrice(
    @Param('id') id: string,
    @Body('shippingPrice') shippingPrice: number,
  ) {
    return this.ordersService.updateShippingPrice(id, shippingPrice);
  }

  @Patch(':id/notes')
  updateNotes(
    @Param('id') id: string,
    @Body() updateNotesDto: UpdateNotesDto,
  ) {
    return this.ordersService.updateNotes(id, updateNotesDto.notes);
  }

  @Post(':orderId/files')
  @UseInterceptors(FileInterceptor('file', multerConfig(new ConfigService())))
  uploadFile(
    @Param('orderId') orderId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.ordersService.uploadOrderFile(orderId, file);
  }

  @Get(':orderId/files')
  getOrderFiles(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderFiles(orderId);
  }

  @Delete(':orderId/files/:fileId')
  deleteFile(
    @Param('orderId') orderId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.ordersService.deleteOrderFile(orderId, fileId);
  }
}