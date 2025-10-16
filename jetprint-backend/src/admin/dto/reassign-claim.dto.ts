import { IsNotEmpty, IsString } from 'class-validator';

export class ReassignClaimDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  newUserId: string;
}