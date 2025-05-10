import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';

export const userSignup = async (req, res,next) => {
    try {
        const { full_name, email, password, gender, cnic_number, contact_number, state, city, current_address, marital_Status,profile_photo,cnic_photo_front,cnic_photo_back } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create User
        const user = await prisma.user.create({
            data: {
                full_name,
                email,
                password: hashedPassword,
                gender,
                cnic_number,
                contact_number,
                state,
                city,
                current_address,
                marital_Status,
                profile_photo, // Save Base64 string
                cnic_photo_front, // Save Base64 string
                cnic_photo_back // Save Base64 string
            },
        });

        // Generate Token
        const token = jwt.sign({ id: user.id, role: 'USER' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        const { password: _, ...userWithoutPassword } = user; // Exclude password

        res.status(201).json({
            message: 'User registered successfully',
            token,
            userWithoutPassword,
        });

    } catch (error) {
        console.error(error);
        next(error);
    }
};

// User Login
export const userLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).json({ message: 'Invalid email or password' });

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid)
            return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, role: 'USER' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password: _, ...userWithoutPassword } = user; // Exclude password

        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('User login error:', error);
        next(error);
    }
};

export const updateUserPassword = async (req, res, next) => {
    try {
        const { id } = req.user; // Authenticated user
        const { oldPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await comparePassword(oldPassword, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Old password is incorrect' });

        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        if (req.maid) {
            return res.status(403).json({ message: 'Not authorized to update user profile' });
        }

        const { id } = req.user; // Authenticated user
        const {
            full_name,
            gender,
            cnic_number,
            contact_number,
            state,
            city,
            current_address,
            marital_Status,
            profile_photo,
            cnic_photo_front,
            cnic_photo_back,
        } = req.body;

        // Update only the allowed fields
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                full_name,
                gender,
                cnic_number,
                contact_number,
                state,
                city,
                current_address,
                marital_Status,
                profile_photo,
                cnic_photo_front,
                cnic_photo_back,
            },
        });

        const { password, ...userWithoutPassword } = updatedUser;
        res.status(200).json({ message: 'Profile updated successfully', updatedUser: userWithoutPassword });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
export const getUserDetails = async (req, res, next) => {
    try {
        const { user_id } = req.params;
        const { role, id } = req.user || req.maid;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(user_id) },
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (role === 'USER' && id !== parseInt(user_id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (role === 'MAID') {
            const maidHire = await prisma.maidHire.findFirst({
                where: { user_id: parseInt(user_id), maid_id: id },
            });

            if (!maidHire) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            const maidHirePayed = await prisma.maidHire.findFirst({
                where: { user_id: parseInt(user_id), maid_id: id, payment_status: 'Paid' },
            });

            if (!maidHirePayed) {
                user.email = '';
                user.cnic_number = '';
                user.contact_number = '';
                user.cnic_photo_front = '';
                user.cnic_photo_back = '';
            }
        }

        const hireCount = await prisma.maidHire.count({ where: { user_id: user.id } });
        const ratings = await prisma.maidHire.findMany({
            where: { user_id: user.id, user_rating: { not: 0 } },
            select: { user_rating: true },
        });

        const ratingCount = ratings.length;
        const averageRating =
            ratings.reduce((sum, r) => sum + r.user_rating, 0) / (ratingCount || 1);

        const { password, ...userWithoutPassword } = user;
        res.status(200).json({ ...userWithoutPassword, hireCount, ratingCount, averageRating });
    } catch (error) {
        console.error(error);
        next(error);
    }
};