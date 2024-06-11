import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import {EventEmitter2} from "@nestjs/event-emitter";
import { ProgressMessageDto } from './dto/ProgressMessage.dto';
import { log } from 'console';

@Controller('image-result')
export class ImageResultController {
  constructor(private readonly eventEmitter: EventEmitter2) {
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async signalChange(@Body() data: ProgressMessageDto) {
    this.eventEmitter.emit(`image-result.${data.Event}.${data.Identifier}`, data)
  }

  @Get("/:event/:identifier")
  async getResult(@Param("event") event: string, @Param("identifier") identifier: string, @Res() response: Response){
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      "Connection": "keepalive"
    })
    response.flushHeaders()

    const onEvent = (data: ProgressMessageDto) => {
      response.write(`event:progress\ndata:${JSON.stringify(data)}\n\n`)
      if(data.CurrentStep === data.MaxSteps) response.end()
    }

    this.eventEmitter.on(`image-result.${event}.${identifier}`, onEvent)
    response.on("close", () => this.eventEmitter.off(`image-result.${event}.${identifier}`, onEvent))
  }
}
