import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Delete,
  Body, 
  Param,
  UseGuards 
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/auth/admin.guard';
import { ReassignClaimDto } from './dto/reassign-claim.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateOrderStageDto } from './dto/update-order-stage.dto';

@UseGuards(JwtAuthGuard, AdminGuard) // Apply guards to the whole controller
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('reassign-claim')
  reassignClaim(@Body() reassignClaimDto: ReassignClaimDto) {
    return this.adminService.reassignClaim(reassignClaimDto);
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('statistics')
  getStatistics() {
    return this.adminService.getStatistics();
  }

  @Get('stages')
  getAllStages() {
    return this.adminService.getAllStages();
  }

  @Post('stages')
  createStage(@Body() createStageDto: CreateStageDto) {
    return this.adminService.createStage(createStageDto.name);
  }

  @Patch('stages/:id/assign-users')
  assignUsersToStage(
    @Param('id') stageId: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.adminService.assignUsersToStage(stageId, userIds);
  }

  @Delete('stages/:id')
  deleteStage(@Param('id') stageId: string) {
    return this.adminService.deleteStage(stageId);
  }

  @Patch('orders/:id/stage')
  updateOrderStage(
    @Param('id') orderId: string,
    @Body() updateOrderStageDto: UpdateOrderStageDto,
  ) {
    return this.adminService.updateOrderStage(orderId, updateOrderStageDto.stage);
  }
}