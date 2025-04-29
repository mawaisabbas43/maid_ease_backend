import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';

export const maidSignup = async (req, res) => {
    try {
        const { full_name, email, password, gender, cnic_number, contact_number, state, city, current_address, marital_Status, experience, skills, job_type,profile_photo,cnic_photo_front,cnic_photo_back } = req.body;

        const existingMaid = await prisma.maid.findUnique({ where: { email } });
        if (existingMaid) {
            return res.status(400).json({ message: 'Maid already exists with this email' });
        }

        const hashedPassword = await hashPassword(password);

        const maid = await prisma.maid.create({
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
                experience: parseFloat(experience),
                skills: JSON.parse(skills), // You will send skills as JSON string
                job_type,
                profile_photo, // Save Base64 string
                cnic_photo_front, // Save Base64 string
                cnic_photo_back // Save Base64 string
            },
        });

        const token = jwt.sign({ id: maid.id, role: 'MAID' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        const { password: _, ...maidWithoutPassword } = maid; // Exclude password
        res.status(201).json({
            message: 'Maid registered successfully',
            token,
            maid: maidWithoutPassword,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Maid Login
export const maidLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const maid = await prisma.maid.findUnique({ where: { email } });

        if (!maid) return res.status(404).json({ message: 'Invalid email or password' });

        const isPasswordValid = await comparePassword(password, maid.password);

        if (!isPasswordValid)
            return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: maid.id, role: 'MAID' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password: _, ...maidWithoutPassword } = maid; // Exclude password
        res.json({ token, maid: maidWithoutPassword });
    } catch (error) {
        console.error('Maid login error:', error);
        next(error);
    }
};
