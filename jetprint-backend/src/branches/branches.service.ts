import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });
    
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    
    return branch;
  }

  async create(name: string) {
    // Check if branch with same name exists
    const existing = await this.prisma.branch.findUnique({
      where: { name },
    });
    
    if (existing) {
      throw new ConflictException('Branch with this name already exists');
    }

    return this.prisma.branch.create({
      data: { name },
    });
  }

  async update(id: string, name: string) {
    await this.findOne(id); // Check if exists
    
    return this.prisma.branch.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    
    return this.prisma.branch.delete({
      where: { id },
    });
  }
}