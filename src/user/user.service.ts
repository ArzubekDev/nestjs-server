
import { Injectable, NotFoundException } from '@nestjs/common'
import { AuthMethod } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
	public constructor(private readonly prismaService: PrismaService) {}
	public async findById(id: string) {
		const user = await this.prismaService.user.findUnique({
			where: { id },
			include: { accounts: true }
		})
		if (!user) {
			throw new NotFoundException(
				'Пользователь не найден. Пожалуйста, проверте введенные данные.'
			)
		}
		return user
	}
	public async findByEmail(email: string) {
		const user = await this.prismaService.user.findUnique({
			where: { email },
			include: { accounts: true }
		})
		return user
	}
	public async create(
		email: string,
		password: string,
		name: string,
		picture: string,
		method: AuthMethod,
		isVerified: boolean
	) {
		const user = await this.prismaService.user.create({
			data: {
				email,
				password: password ? await bcrypt.hash(password) : undefined,
				name,
				picture,
				method,
				isVerified
			},
			include: { accounts: true }
		})
        return user
	}
}
