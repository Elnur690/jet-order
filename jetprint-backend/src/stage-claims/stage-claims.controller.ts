import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import { StageClaimsService } from './stage-claims.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from '@prisma/client';
import { CreateStageClaimDto } from './dto/create-stage-claim.dto';

interface AuthenticatedRequest extends Request {
  user: User;
}

@UseGuards(JwtAuthGuard)
@Controller('stage-claims')
export class StageClaimsController {
  constructor(private readonly claimsService: StageClaimsService) {}

  @Post()
  create(
    @Body() createDto: CreateStageClaimDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.claimsService.create(createDto, req.user);
  }

  @Patch(':id/advance')
  advanceStage(
    @Param('id') claimId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.claimsService.advanceStage(claimId, req.user);
  }

  @Get('my-assignments')
  findMyAssignments(@Request() req: AuthenticatedRequest) {
    return this.claimsService.findMyAllClaims(req.user.id);
  }

  @Get('my-assignments/active')
  findMyActiveAssignments(@Request() req: AuthenticatedRequest) {
    return this.claimsService.findMyActiveClaims(req.user.id);
  }

  @Get('my-assignments/completed')
  findMyCompletedAssignments(@Request() req: AuthenticatedRequest) {
    return this.claimsService.findMyCompletedClaims(req.user.id);
  }
}