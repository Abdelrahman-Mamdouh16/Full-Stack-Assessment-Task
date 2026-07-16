import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { AuthSession, CurrentUser } from '@projectflow/shared';
import type { JwtPayload } from '../common/guards/jwt-auth.guard';
import { toUserSummary } from '../common/utils/serialize';
import { toObjectId } from '../common/utils/object-id';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import type { UserDocument } from '../users/schemas/user.schema';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSession> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      avatarUrl: dto.avatarUrl ?? null,
    });

    return this.buildSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildSession(user);
  }

  async getCurrentUser(userId: string): Promise<CurrentUser> {
    const objectId = toObjectId(userId, 'user id');
    const user = await this.usersService.findByIdOrFail(objectId);
    const organizations = await this.organizationsService.findForUser(objectId);

    return { ...toUserSummary(user), organizations };
  }

  private async buildSession(user: UserDocument): Promise<AuthSession> {
    const payload: JwtPayload = { sub: user._id.toString(), email: user.email };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: toUserSummary(user),
    };
  }
}
