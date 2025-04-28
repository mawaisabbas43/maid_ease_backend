import prisma from '../config/db.js';

// 1. Create a new maid hire entry
export const createMaidHire = async (req, res, next) => {
    try {
        const { maid_id, house_size, no_of_portions, no_of_peoples, hired_skills, prefered_work_time, house_photo, total_amount } = req.body;

        // Ensure the user is authenticated and has the 'USER' role
        if (!req.user || req.user.role !== 'USER') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const maidHire = await prisma.maidHire.create({
            data: {
                user_id: req.user.id,
                maid_id,
                house_size: parseFloat(house_size),
                no_of_portions: parseInt(no_of_portions),
                no_of_peoples: parseInt(no_of_peoples),
                hired_skills: JSON.parse(hired_skills),
                prefered_work_time,
                house_photo,
                total_amount: parseFloat(total_amount),
            },
        });

        res.status(201).json({ message: 'Maid hire created successfully', maidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// 2. Update acceptance status
export const updateAcceptanceStatus = async (req, res, next) => {
    try {
        const { maid_hire_id, status } = req.body;

        // Ensure the maid is authenticated and has the 'MAID' role
        if (!req.maid || req.maid.role !== 'MAID') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const maidHire = await prisma.maidHire.update({
            where: { id: parseInt(maid_hire_id) },
            data: { acceptance_status: status },
        });

        res.status(200).json({ message: 'Acceptance status updated successfully', maidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// 3. Update payment status
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const { maid_hire_id, payment_status } = req.body;

        // Ensure the user is authenticated and has the 'USER' role
        if (!req.user || req.user.role !== 'USER') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const maidHire = await prisma.maidHire.update({
            where: { id: parseInt(maid_hire_id) },
            data: { payment_status },
        });

        res.status(200).json({ message: 'Payment status updated successfully', maidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};