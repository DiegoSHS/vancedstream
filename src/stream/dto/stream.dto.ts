import { IsString, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class StreamQueryDto {
    @IsString()
    @Matches(/^magnet:\?/, { message: 'Invalid magnet link format' })
    magnet: string;

    @IsOptional()
    @Transform(({ value }) => value?.toLowerCase() === 'true')
    progressive?: boolean = true;
}

interface StreamDataDto {
    stream: ReadableStream<Uint8Array>; // ReadableStream
    mimeType: string;
    fileName: string;
    fileSize: number;
}

export class StreamResponseDto {
    success: boolean;
    data: StreamDataDto | null;
    error: string | null;
    timestamp: number;
}
