import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
        { id: admin.id, role: 'ADMIN' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all maid profiles (for admin)
export const getAllMaidProfiles = async (req, res) => {
  try {
    const maids = await prisma.maid.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        gender: true,
        cnic_number: true,
        contact_number: true,
        state: true,
        city: true,
        current_address: true,
        marital_Status: true,
        experience: true,
        skills: true,
        job_type: true,
        profile_description: true,
        profile_title: true,
        profile_photo: true,
        cnic_photo_front: true,
        cnic_photo_back: true,
        profile_status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.status(200).json({ maids });
  } catch (error) {
    console.error('Get all maid profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 1. Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        gender: true,
        cnic_number: true,
        contact_number: true,
        state: true,
        city: true,
        current_address: true,
        marital_Status: true,
        profile_photo: true,
        cnic_photo_front: true,
        cnic_photo_back: true,
        profile_status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Update profile_status of maid
export const updateMaidProfileStatus = async (req, res) => {
  const { maidId } = req.params;
  const { profile_status } = req.body;
  try {
    const updatedMaid = await prisma.maid.update({
      where: { id: parseInt(maidId) },
      data: { profile_status }
    });
    res.status(200).json({ message: 'Maid profile status updated', maid: updatedMaid });
  } catch (error) {
    console.error('Update maid profile status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Update profile_status of user
export const updateUserProfileStatus = async (req, res) => {
  const { userId } = req.params;
  const { profile_status } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { profile_status }
    });
    console.log(updatedUser);
    res.status(200).json({ message: 'User profile status updated', user: updatedUser });
  } catch (error) {
    console.error('Update user profile status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. List of hirings
export const getAllHirings = async (req, res) => {
  try {
    const hirings = await prisma.maidHire.findMany({
      include: {
        user: {
          select: { id: true, full_name: true, email: true }
        },
        maid: {
          select: { id: true, full_name: true, email: true }
        }
      }
    });
    res.status(200).json({ hirings });
  } catch (error) {
    console.error('Get all hirings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdmin = async (req, res) => {
  const { name, email, password, registrationKey } = req.body;
  const STATIC_KEY = process.env.ADMIN_REG_KEY || 'STATIC_SECRET_KEY';

  if (registrationKey !== STATIC_KEY) {
    return res.status(403).json({ message: 'Invalid registration key' });
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Admin with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const admin = await prisma.admin.create({
      data: { name, email, password: hashedPassword }
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};