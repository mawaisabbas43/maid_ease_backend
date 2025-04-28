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

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user,
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

        res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email } });
    } catch (error) {
        console.error('User login error:', error);
        next(error);
    }
};
