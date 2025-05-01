import prisma from '../config/db.js';

// 1. Create a new maid hire entry
export const createMaidHire = async (req, res, next) => {
    try {
        const { maid_id, house_size, no_of_portions, no_of_peoples, hired_skills, preferred_work_time, house_photo, total_amount } = req.body;

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
                preferred_work_time,
                house_photo,
                total_amount: parseFloat(total_amount),
                acceptance_status: 'Pending', // Default value
                payment_status: 'Pending', // Default value
                user_rating: 0,
                maid_rating: 0
            },
        });

        res.status(201).json({ message: 'Maid hire created successfully', maidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Get all maidHire records for a maid
export const getMaidHireRecordsForMaid = async (req, res, next) => {
    try {
        if (!req.maid || req.maid.role !== 'MAID') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const maidHires = await prisma.maidHire.findMany({
            where: { maid_id: req.maid.id },
            include: {
                user: {
                    select: {
                        id: true,
                        full_name: true,
                        profile_photo: true,
                        email: true,
                    },
                },
            },
        });

        res.status(200).json({ maidHires });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Get all maidHire records for a user
export const getMaidHireRecordsForUser = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'USER') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const maidHires = await prisma.maidHire.findMany({
            where: { user_id: req.user.id },
            include: {
                maid: {
                    select: {
                        id: true,
                        full_name: true,
                        profile_photo: true,
                        email: true,
                    },
                },
            },
        });

        res.status(200).json({ maidHires });
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

        // Fetch the maid hire entry
        const maidHire = await prisma.maidHire.findUnique({
            where: { id: parseInt(maid_hire_id) },
        });

        // Check if the entry exists and belongs to the authenticated maid
        if (!maidHire || maidHire.maid_id !== req.maid.id) {
            return res.status(403).json({ message: 'Not authorized to update this entry' });
        }

        // Update the acceptance status
        const updatedMaidHire = await prisma.maidHire.update({
            where: { id: parseInt(maid_hire_id) },
            data: { acceptance_status: status },
        });

        res.status(200).json({ message: 'Acceptance status updated successfully', updatedMaidHire });
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

        // Fetch the maid hire entry
        const maidHire = await prisma.maidHire.findUnique({
            where: { id: parseInt(maid_hire_id) },
        });

        // Check if the entry exists and belongs to the authenticated user
        if (!maidHire || maidHire.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Wrong maid hire id or Not authorized to update this entry' });
        }

        // Update the payment status
        const updatedMaidHire = await prisma.maidHire.update({
            where: { id: parseInt(maid_hire_id) },
            data: { payment_status },
        });

        res.status(200).json({ message: 'Payment status updated successfully', updatedMaidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateMaidRating = async (req, res, next) => {
    try {
        const { maid_hire_id, rating } = req.body;

        if (!req.user || req.user.role !== 'USER') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const maidHire = await prisma.maidHire.findUnique({
            where: { id: parseInt(maid_hire_id) },
        });

        if (!maidHire || maidHire.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this entry' });
        }

        if (maidHire.maid_rating > 0 && maidHire.maid_rating <= 5) {
            return res.status(403).json({ message: 'Rating already given. Not authorized to update' });
        }

        const updatedMaidHire = await prisma.maidHire.update({
            where: { id: parseInt(maid_hire_id) },
            data: { maid_rating: parseInt(rating) },
        });

        res.status(200).json({ message: 'Maid rating updated successfully', updatedMaidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const updateUserRating = async (req, res, next) => {
    try {
        const { maid_hire_id, rating } = req.body;

        if (!req.maid || req.maid.role !== 'MAID') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const maidHire = await prisma.maidHire.findUnique({
            where: { id: parseInt(maid_hire_id) },
        });

        if (!maidHire || maidHire.maid_id !== req.maid.id) {
            return res.status(403).json({ message: 'Wrong maid hire Id or Not authorized to update this entry' });
        }

        if (maidHire.user_rating > 0 && maidHire.user_rating <= 5) {
            return res.status(403).json({ message: 'Rating already given. Not authorized to update' });
        }

        const updatedMaidHire = await prisma.maidHire.update({
            where: { id: parseInt(maid_hire_id) },
            data: { user_rating: parseInt(rating) },
        });

        res.status(200).json({ message: 'User rating updated successfully', updatedMaidHire });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getMaidRatings = async (req, res, next) => {
    try {
        const { maid_id } = req.params;

        const ratings = await prisma.maidHire.groupBy({
            by: ['maid_rating'],
            where: { maid_id: parseInt(maid_id) },
            _count: { maid_rating: true },
        });

        const structuredRatings = ratings.map((r) => ({
            name: `${r.maid_rating} Star`,
            value: r._count.maid_rating,
        }));

        res.status(200).json({ ratings: structuredRatings });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

export const getUserRatings = async (req, res, next) => {
    try {
        const { user_id } = req.params;

        if (req.user && req.user.role === 'USER' && req.user.id !== parseInt(user_id)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.maid && req.maid.role === 'MAID') {
            const maidHire = await prisma.maidHire.findFirst({
                where: { user_id: parseInt(user_id), maid_id: req.maid.id },
            });

            if (!maidHire) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        const ratings = await prisma.maidHire.groupBy({
            by: ['user_rating'],
            where: { user_id: parseInt(user_id) },
            _count: { user_rating: true },
        });

        const structuredRatings = ratings.map((r) => ({
            name: `${r.user_rating} Star`,
            value: r._count.user_rating,
        }));

        res.status(200).json({ ratings: structuredRatings });
    } catch (error) {
        console.error(error);
        next(error);
    }
};