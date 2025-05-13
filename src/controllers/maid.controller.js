import prisma from '../config/db.js';
import {comparePassword, hashPassword} from '../utils/password.util.js';
import jwt from 'jsonwebtoken';
import {JWT_EXPIRES_IN, JWT_SECRET} from '../config/jwt.js';
import { generateMaidProfile } from '../services/openai.service.js';


export const maidSignup = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      gender,
      cnic_number,
      contact_number,
      state,
      city,
      current_address,
      marital_Status,
      experience,
      skills,
      job_type,
      profile_photo,
      cnic_photo_front,
      cnic_photo_back,
      use_ai,
      profile_title,
      profile_description,
    } = req.body;

    const existingMaid = await prisma.maid.findUnique({ where: { email } });
    if (existingMaid) {
      return res.status(400).json({ message: 'Maid already exists with this email' });
    }

    const hashedPassword = await hashPassword(password);

    let finalProfileTitle = profile_title;
    let finalProfileDescription = profile_description;

    if (use_ai) {
      const generatedProfile = await generateMaidProfile({
        full_name,
        gender,
        state,
        city,
        current_address,
        marital_Status,
        experience,
        skills: JSON.parse(skills),
      });
      finalProfileTitle = generatedProfile.profile_title;
      finalProfileDescription = generatedProfile.profile_description;
    }

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
        skills: JSON.parse(skills),
        job_type,
        profile_title: finalProfileTitle,
        profile_description: finalProfileDescription,
        profile_photo,
        cnic_photo_front,
        cnic_photo_back,
      },
    });

    const token = jwt.sign({ id: maid.id, role: 'MAID' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const { password: _, ...maidWithoutPassword } = maid;
    res.status(201).json({
      message: 'Maid registered successfully',
      token,
      maid: maidWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Maid Login
export const maidLogin = async (req, res, next) => {
  const {email, password} = req.body;

  try {
    const maid = await prisma.maid.findUnique({where: {email}});

    if (!maid) return res.status(404).json({message: 'Invalid email or password'});

    const isPasswordValid = await comparePassword(password, maid.password);

    if (!isPasswordValid)
      return res.status(400).json({message: 'Invalid email or password'});

    const token = jwt.sign(
        {id: maid.id, role: 'MAID'},
        JWT_SECRET,
        {expiresIn: JWT_EXPIRES_IN}
    );

    const {password: _, ...maidWithoutPassword} = maid; // Exclude password
    res.json({token, maid: maidWithoutPassword});
  } catch (error) {
    console.error('Maid login error:', error);
    next(error);
  }
};

export const updateMaidPassword = async (req, res, next) => {
  try {
    const {id} = req.maid; // Authenticated maid
    const {oldPassword, newPassword} = req.body;

    const maid = await prisma.maid.findUnique({where: {id}});

    if (!maid) return res.status(404).json({message: 'Maid not found'});

    const isPasswordValid = await comparePassword(oldPassword, maid.password);
    if (!isPasswordValid) return res.status(400).json({message: 'Old password is incorrect'});

    const hashedPassword = await hashPassword(newPassword);
    await prisma.maid.update({
      where: {id},
      data: {password: hashedPassword},
    });

    res.status(200).json({message: 'Password updated successfully'});
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateMaidProfile = async (req, res, next) => {
  try {
    if (req.user) {
      return res.status(403).json({message: 'Not authorized to update maid profile'});
    }

    const {id} = req.maid; // Authenticated maid
    const {
      full_name,
      gender,
      cnic_number,
      contact_number,
      state,
      city,
      current_address,
      marital_Status,
      experience,
      skills,
      job_type,
      profile_title,
      profile_description,
      profile_photo,
      cnic_photo_front,
      cnic_photo_back,
    } = req.body;

    const updatedMaid = await prisma.maid.update({
      where: {id},
      data: {
        full_name,
        gender,
        cnic_number,
        contact_number,
        state,
        city,
        current_address,
        marital_Status,
        experience,
        skills,
        job_type,
        profile_title,
        profile_description,
        profile_photo,
        cnic_photo_front,
        cnic_photo_back,
      },
    });

    const {password, ...maidWithoutPassword} = updatedMaid;
    res.status(200).json({message: 'Profile updated successfully', updatedMaid: maidWithoutPassword});
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getAllMaids = async (req, res, next) => {
  try {
    const maids = await prisma.maid.findMany({
      select: {
        id: true,
        full_name: true,
        gender: true,
        state: true,
        city: true,
        current_address: true,
        marital_Status: true,
        experience: true,
        skills: true,
        job_type: true,
        profile_photo: true,
        profile_description: true,
        profile_title: true,
        createdAt: true,
      },
    });

    const maidsWithStats = await Promise.all(
        maids.map(async (maid) => {
          const hireCount = await prisma.maidHire.count({where: {maid_id: maid.id}});
          const ratings = await prisma.maidHire.findMany({
            where: {maid_id: maid.id, maid_rating: {not: 0}},
            select: {maid_rating: true},
          });

          const ratingCount = ratings.length;
          const averageRating =
              ratings.reduce((sum, r) => sum + r.maid_rating, 0) / (ratingCount || 1);

          return {...maid, hireCount, ratingCount, averageRating: averageRating || 0};
        })
    );

    res.status(200).json(maidsWithStats);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getMaidById = async (req, res, next) => {
  try {
    const {id} = req.params;

    const maid = await prisma.maid.findUnique({
      where: {id: parseInt(id)},
      select: {
        id: true,
        full_name: true,
        gender: true,
        state: true,
        city: true,
        current_address: true,
        marital_Status: true,
        experience: true,
        skills: true,
        job_type: true,
        profile_photo: true,
        profile_description: true,
        profile_title: true,
        createdAt: true,
      },
    });

    if (!maid) return res.status(404).json({message: 'Maid not found'});

    const hireCount = await prisma.maidHire.count({where: {maid_id: maid.id}});
    const ratings = await prisma.maidHire.findMany({
      where: {maid_id: maid.id, maid_rating: {not: 0}},
      select: {maid_rating: true},
    });

    const ratingCount = ratings.length;
    const averageRating =
        ratings.reduce((sum, r) => sum + r.maid_rating, 0) / (ratingCount || 1);

    res.status(200).json({...maid, hireCount, ratingCount, averageRating: averageRating || 0});
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getAuthMaidDetails = async (req, res, next) => {
  try {
    const {id} = req.params;
    const {role, id: authId} = req.user || req.maid;

    const maid = await prisma.maid.findUnique({
      where: {id: parseInt(id)},
    });

    if (!maid) return res.status(404).json({message: 'Maid not found'});

    if (role === 'MAID' && authId !== parseInt(id)) {
      return res.status(403).json({message: 'Not authorized'});
    }

    if (role === 'USER') {
      const maidHire = await prisma.maidHire.findFirst({
        where: {maid_id: parseInt(id), user_id: authId},
      });

      if (!maidHire) {
        return res.status(403).json({message: 'Not authorized'});
      }

      const maidHirePaid = await prisma.maidHire.findFirst({
        where: {maid_id: parseInt(id), user_id: authId, payment_status: 'Paid'},
      });

      if (!maidHirePaid) {
        maid.email = '';
        maid.cnic_number = '';
        maid.contact_number = '';
        maid.cnic_photo_front = '';
        maid.cnic_photo_back = '';
      }
    }

    const hireCount = await prisma.maidHire.count({where: {maid_id: maid.id}});
    const ratings = await prisma.maidHire.findMany({
      where: {maid_id: maid.id, maid_rating: {not: 0}},
      select: {maid_rating: true},
    });

    const ratingCount = ratings.length;
    const averageRating =
        ratings.reduce((sum, r) => sum + r.maid_rating, 0) / (ratingCount || 1);

    const {password, ...maidWithoutPassword} = maid;
    res.status(200).json({...maidWithoutPassword, hireCount, ratingCount, averageRating});
  } catch (error) {
    console.error(error);
    next(error);
  }
};