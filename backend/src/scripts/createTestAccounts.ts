import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mohammednabhaanvalai:Rahman123@edusys.5hnirhz.mongodb.net/';

async function createTestAccounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash password
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Delete existing test accounts if they exist
    console.log('Removing existing test accounts...');
    await User.deleteMany({
      email: {
        $in: ['admin@school.com', 'teacher@school.com', 'student@school.com']
      }
    });

    // Create admin account
    const admin = new User({
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'admin',
      profile: {
        name: 'Admin User',
        employeeId: 'ADM001',
        department: 'Administration',
        phone: '1234567890'
      },
      isActive: true
    });

    // Create teacher account
    const teacher = new User({
      email: 'teacher@school.com',
      password: hashedPassword,
      role: 'teacher',
      profile: {
        name: 'Teacher User',
        employeeId: 'TCH001',
        subjects: ['Mathematics', 'Science'],
        phone: '1234567891',
        address: '123 School Street',
        dateOfJoining: new Date()
      },
      isActive: true
    });

    // Create student account
    const student = new User({
      email: 'student@school.com',
      password: hashedPassword,
      role: 'student',
      profile: {
        name: 'Student User',
        rollNo: 'STU001',
        standard: '10',
        section: 'A',
        dateOfBirth: new Date('2010-01-01'),
        admissionDate: new Date(),
        parentContact: {
          fatherName: 'John Doe',
          motherName: 'Jane Doe',
          phone: '1234567892',
          email: 'parent@example.com',
          address: '123 Home Street'
        }
      },
      isActive: true
    });

    // Save the new accounts
    console.log('Creating new test accounts...');
    
    try {
      await Promise.all([
      admin.save(),
      teacher.save(),
      student.save()
    ]);

    console.log('Test accounts created successfully!');
    console.log('Login credentials:');
    console.log('Admin: admin@school.com / admin123');
    console.log('Teacher: teacher@school.com / admin123');
    console.log('Student: student@school.com / admin123');

  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestAccounts();
