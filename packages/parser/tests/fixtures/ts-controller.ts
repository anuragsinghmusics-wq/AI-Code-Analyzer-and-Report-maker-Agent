import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(private readonly userService: any) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(id: string) {
    if (!id) {
      throw new Error('ID required');
    }
    return this.userService.findOne(id);
  }
}

export function helperFn() {
  return true;
}
