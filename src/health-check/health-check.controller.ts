import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthCheckController {
  @Get()
  execute() {
    return 'Payments-MS is up and running!';
  }
}
