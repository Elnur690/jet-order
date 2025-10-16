import { Module } from '@nestjs/common';
import { StageClaimsService } from './stage-claims.service';
import { StageClaimsController } from './stage-claims.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [StageClaimsController],
  providers: [StageClaimsService],
})
export class StageClaimsModule {}