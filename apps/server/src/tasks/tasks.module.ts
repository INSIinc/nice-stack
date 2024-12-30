import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { InitModule } from '@server/tasks/init/init.module';
import { ReminderModule } from "@server/tasks/reminder/reminder.module"
@Module({
  imports: [InitModule, ReminderModule],
  providers: [TasksService]
})
export class TasksModule { }
