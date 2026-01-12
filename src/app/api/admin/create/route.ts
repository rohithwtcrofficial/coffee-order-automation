// src/app/api/admin/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone, department, photoURL, createdBy } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      photoURL: photoURL || undefined,
    });

    // Create admin document in Firestore
    await adminDb.collection('admins').doc(userRecord.uid).set({
      name,
      email,
      role: role || 'staff',
      phone: phone || '',
      department: department || '',
      photoURL: photoURL || '',
      createdAt: Timestamp.now(),
      createdBy: createdBy || '',
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      message: 'Admin created successfully',
    });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create admin' },
      { status: 500 }
    );
  }
}