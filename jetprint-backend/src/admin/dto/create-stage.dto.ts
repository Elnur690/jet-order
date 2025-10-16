import { IsNotEmpty, IsEnum } from 'class-validator';
import { OrderStage } from '@prisma/client';

export class CreateStageDto {
  @IsNotEmpty()
  @IsEnum(OrderStage)
  name: OrderStage;
}

