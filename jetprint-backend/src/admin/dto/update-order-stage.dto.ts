import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStage } from '@prisma/client';

export class UpdateOrderStageDto {
  @IsEnum(OrderStage)
  @IsNotEmpty()
  stage: OrderStage;
}

