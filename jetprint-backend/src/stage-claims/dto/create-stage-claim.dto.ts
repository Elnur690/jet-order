import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStageClaimDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}