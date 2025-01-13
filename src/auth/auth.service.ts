// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    console.log('Validating user:', email); // Debug log
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    console.log('Found user:', user ? 'yes' : 'no'); // Debug log

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid); // Debug log

      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    console.log('Generating token for user:', user.id); // Debug log

    const token = this.jwtService.sign(payload);
    return {
      access_token: token, // Fixed the property name
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(email: string, password: string, name: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate token immediately after registration
    const { password: _, ...userData } = user;
    const token = await this.login(userData);

    return {
      ...token,
      user: userData,
    };
  }
}
