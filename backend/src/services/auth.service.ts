import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { LoginInput, RegisterInput } from '../controllers/auth.controller';

export const registerUser = async (input: RegisterInput) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
        data: {
            name: input.name,
            nickname: input.nickname || 'User',
            email: input.email,
            password: hashedPassword,
        },
    });

    const token = signToken(user.id);

    // Return all user fields except password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};

export const loginUser = async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    const token = signToken(user.id);

    // Return all user fields except password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};
