import { IsNotEmpty, IsString } from "class-validator";

export class SaveHashDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    hash: string;
}