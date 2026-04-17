import { Module } from "@nestjs/common";
import { ThePBService } from "./thepb.service.js";
import { LoggerService } from "../common/logger/logger.service.js";

@Module({
    providers: [ThePBService, LoggerService],
    exports: [ThePBService]
})
export class ThePBModule { }