import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateNotesDto {
  @IsString()
  @IsNotEmpty()
  notes: string;
}

