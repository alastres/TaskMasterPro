import prisma from '../config/db';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { LoginInput, RegisterInput } from '../controllers/auth.controller';

export const registerUser = async (data: RegisterInput) => {
    const { name, nickname, email, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError('Email already in use', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Assuming hashPassword is bcrypt.hash

    // Check if this is the first user (make them ADMIN)
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            nickname: nickname || 'User',
            email,
            password: hashedPassword,
            role,
        },
    });

    const token = signToken(user.id); // Assuming generateToken is signToken

    return {
        user: {
            id: user.id,
            name: user.name,
            nickname: user.nickname,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            thresholdMedium: user.thresholdMedium,
            thresholdHigh: user.thresholdHigh,
        },
        token,
    };
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
