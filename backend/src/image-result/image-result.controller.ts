import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Sse} from '@nestjs/common';
import {EventEmitter2} from "@nestjs/event-emitter";

@Controller('image-result')
export class ImageResultController {
  constructor(private readonly eventEmitter: EventEmitter2) {
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async signalFinish(@Body() data: unknown) {
    this.eventEmitter.emit("image-result.finished", data)
  }

  @Get("/:filename")
  async getResult(@Param("filename") filename: string){
    return new Promise(resolve => {
      this.eventEmitter.once("image-result.finished", data => {
        if(data.input !== filename) return
        resolve(data)
      })
    })
  }
}
