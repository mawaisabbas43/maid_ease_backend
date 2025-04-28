import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import prisma from '../config/db.js';

// Middleware to verify token and attach user/maid to request
export const protect = async (req, res, next) => {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role === 'USER') {
            req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
            req.user.role = 'USER'; // Attach role
        } else if (decoded.role === 'MAID') {
            req.maid = await prisma.maid.findUnique({ where: { id: decoded.id } });
            req.maid.role = 'MAID'; // Attach role
        } else {
            return res.status(401).json({ message: 'Invalid role' });
        }

        if (!req.user && !req.maid) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
