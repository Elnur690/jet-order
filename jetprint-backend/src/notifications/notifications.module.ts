import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [WebsocketModule, PrismaModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
