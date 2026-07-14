import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Public } from '../../common/decorators/public.decorator';

/** US1: public mini-program project browse (no auth). */
@Controller('mp/projects')
export class ProjectsPublicController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @Public()
  list(@Query('page') page = '1', @Query('size') size = '10') {
    return this.projects.listPublished(Number(page) || 1, Number(size) || 10);
  }

  @Get(':id')
  @Public()
  detail(@Param('id') id: string) {
    return this.projects.findOnePublished(id);
  }
}
