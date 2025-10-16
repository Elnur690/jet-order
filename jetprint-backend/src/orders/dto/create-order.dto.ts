// No changes needed here, just confirming the content is correct
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;

  // ✅ FIX: Use @Type() to transform string from form-data to boolean
  @IsBoolean()
  @Type(() => Boolean)
  isUrgent: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shippingPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // ✅ FIX: Expect a JSON stringified array of products
  @IsString()
  @IsNotEmpty()
  products: string;
}