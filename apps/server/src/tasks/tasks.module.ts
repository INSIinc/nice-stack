import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { InitModule } from '@server/init/init.module';
@Module({
  imports: [InitModule],
  providers: [TasksService]
})
export class TasksModule { }
