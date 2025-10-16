import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { PaperType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Type(() => Number)
  width: number;

  @IsNumber()
  @Type(() => Number)
  height: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsBoolean()
  @Type(() => Boolean)
  needsDesign: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  designAmount?: number;

  @IsBoolean()
  @Type(() => Boolean)
  needsCut: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  needsLamination: boolean;

  @IsEnum(PaperType)
  paperType: PaperType;
}