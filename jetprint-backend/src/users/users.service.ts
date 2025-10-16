import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ✅ NEW METHOD ADDED
  async findAll() {
    // Return all users with their assigned stages
    return this.prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        role: true,
        stages: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({ 
      where: { id },
      include: { stages: true },
    });
  }

  /**
   * Create a new user (admin function)
   */
  async create(phone: string, role: UserRole) {
    // Check if user already exists
    const existing = await this.findOneByPhone(phone);
    if (existing) {
      throw new ConflictException('User with this phone number already exists');
    }

    return this.prisma.user.create({
      data: {
        phone,
        role,
      },
      include: {
        stages: true,
      },
    });
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, role: UserRole) {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { stages: true },
    });
  }

  /**
   * Delete a user
   */
  async remove(userId: string) {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Assign a user to stages
   */
  async assignToStages(userId: string, stageIds: string[]) {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        stages: {
          set: stageIds.map(id => ({ id })),
        },
      },
      include: { stages: true },
    });
  }
}