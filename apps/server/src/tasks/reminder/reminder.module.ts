import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { MessageModule } from '@server/models/message/message.module';

@Module({
  imports: [ MessageModule],
  providers: [ReminderService],
  exports: [ReminderService]
})
export class ReminderModule { }
