import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [WebsocketModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}