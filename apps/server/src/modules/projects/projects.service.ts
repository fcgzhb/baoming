import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Project } from '../../database/entities/project.entity';
import { ProjectStatus } from '@baoming/shared';
import { BusinessError } from '../../common/errors/business-error';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private readonly repo: Repository<Project>) {}

  create(dto: CreateProjectDto, adminId: string) {
    const proj = this.repo.create({
      title: dto.title,
      coverImageUrl: dto.coverImageUrl ?? null,
      description: dto.description ?? null,
      itinerary: dto.itinerary ?? null,
      departureDate: dto.departureDate ?? null,
      returnDate: dto.returnDate ?? null,
      price: Number(dto.price).toFixed(2),
      totalQuota: dto.totalQuota,
      registeredCount: 0,
      enrollDeadline: dto.enrollDeadline ? new Date(dto.enrollDeadline) : null,
      status: dto.status ?? ProjectStatus.DRAFT,
      createdByAdminId: adminId,
    });
    return this.repo.save(proj);
  }

  async update(id: string, dto: UpdateProjectDto) {
    const proj = await this.repo.findOne({ where: { id } });
    if (!proj) throw BusinessError.notFound('项目不存在');
    const patch: DeepPartial<Project> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.coverImageUrl !== undefined) patch.coverImageUrl = dto.coverImageUrl;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.itinerary !== undefined) patch.itinerary = dto.itinerary;
    if (dto.departureDate !== undefined) patch.departureDate = dto.departureDate;
    if (dto.returnDate !== undefined) patch.returnDate = dto.returnDate;
    if (dto.price !== undefined) patch.price = Number(dto.price).toFixed(2);
    if (dto.totalQuota !== undefined) {
      if (dto.totalQuota < proj.registeredCount) {
        throw BusinessError.conflict('总名额不能小于已报名人数');
      }
      patch.totalQuota = dto.totalQuota;
    }
    if (dto.enrollDeadline !== undefined) {
      patch.enrollDeadline = dto.enrollDeadline ? new Date(dto.enrollDeadline) : null;
    }
    if (dto.status !== undefined) patch.status = dto.status;
    Object.assign(proj, patch);
    return this.repo.save(proj);
  }

  async findOne(id: string) {
    const proj = await this.repo.findOne({ where: { id } });
    if (!proj) throw BusinessError.notFound('项目不存在');
    return proj;
  }

  async findAll(q: QueryProjectDto) {
    const page = q.page ?? 1;
    const size = q.size ?? 10;
    const qb = this.repo.createQueryBuilder('p');
    if (q.status) {
      qb.andWhere('p.status = :status', { status: q.status });
    }
    if (q.q) {
      qb.andWhere('p.title LIKE :q', { q: `%${q.q}%` });
    }
    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, size };
  }

  async publish(id: string) {
    const proj = await this.findOne(id);
    if (proj.status !== ProjectStatus.DRAFT && proj.status !== ProjectStatus.OFFLINE) {
      throw BusinessError.conflict('仅草稿/已下架项目可上架');
    }
    proj.status = ProjectStatus.PUBLISHED;
    return this.repo.save(proj);
  }

  async offline(id: string) {
    const proj = await this.findOne(id);
    if (proj.status !== ProjectStatus.PUBLISHED) {
      throw BusinessError.conflict('仅已上架项目可下架');
    }
    proj.status = ProjectStatus.OFFLINE;
    return this.repo.save(proj);
  }

  async remove(id: string) {
    const proj = await this.findOne(id);
    await this.repo.softDelete(proj.id);
    return { id };
  }

  // ---------- Public (mini-program, US1) ----------

  async listPublished(page = 1, size = 10) {
    const [rows, total] = await this.repo.findAndCount({
      where: { status: ProjectStatus.PUBLISHED },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { list: rows.map((p) => this.toListItem(p)), total, page, size };
  }

  async findOnePublished(id: string) {
    const proj = await this.repo.findOne({ where: { id } });
    if (!proj || proj.status !== ProjectStatus.PUBLISHED) {
      throw BusinessError.notFound('项目不存在');
    }
    return this.toDetail(proj);
  }

  private remainingQuota(p: Project): number {
    return Math.max(0, p.totalQuota - p.registeredCount);
  }

  private enrollable(p: Project): boolean {
    const notExpired = !p.enrollDeadline || p.enrollDeadline.getTime() > Date.now();
    return p.status === ProjectStatus.PUBLISHED && notExpired && this.remainingQuota(p) > 0;
  }

  private toListItem(p: Project) {
    return {
      id: p.id,
      title: p.title,
      coverImageUrl: p.coverImageUrl,
      price: p.price,
      departureDate: p.departureDate,
      enrollDeadline: p.enrollDeadline,
      remainingQuota: this.remainingQuota(p),
    };
  }

  private toDetail(p: Project) {
    return {
      id: p.id,
      title: p.title,
      coverImageUrl: p.coverImageUrl,
      description: p.description,
      itinerary: p.itinerary,
      departureDate: p.departureDate,
      returnDate: p.returnDate,
      price: p.price,
      totalQuota: p.totalQuota,
      registeredCount: p.registeredCount,
      remainingQuota: this.remainingQuota(p),
      enrollDeadline: p.enrollDeadline,
      enrollable: this.enrollable(p),
    };
  }
}
