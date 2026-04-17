import { Module } from "@nestjs/common";
import { ThePBService } from "./thepb.service.js";

@Module({
    providers: [ThePBService],
    exports: [ThePBService]
})
export class ThePBModule { }