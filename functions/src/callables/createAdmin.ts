import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  phone?: string;
  department?: string;
  photoURL?: string;
}

const ROLE_HIERARCHY = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  staff: 1
};

export const createAdmin = onCall<CreateAdminRequest>(async (request) => {
  const { data, auth } = request;

  // Check if user is authenticated
  if (!auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to create admins.'
    );
  }

  try {
    // Get the calling admin's data
    const callingAdminDoc = await admin.firestore()
      .collection('admins')
      .doc(auth.uid)
      .get();

    if (!callingAdminDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'You are not authorized to create admins.'
      );
    }

    const callingAdmin = callingAdminDoc.data();
    
    // Check if calling admin has permission
    if (ROLE_HIERARCHY[callingAdmin?.role as keyof typeof ROLE_HIERARCHY] < ROLE_HIERARCHY.admin) {
      throw new HttpsError(
        'permission-denied',
        'You do not have permission to create admins.'
      );
    }

    // Check if regular admin is trying to create super_admin or admin
    if (callingAdmin?.role === 'admin' && 
        (data.role === 'super_admin' || data.role === 'admin')) {
      throw new HttpsError(
        'permission-denied',
        'You can only create Manager or Staff accounts.'
      );
    }

    // Validate required fields
    if (!data.name || !data.email || !data.password) {
      throw new HttpsError(
        'invalid-argument',
        'Name, email, and password are required.'
      );
    }

    if (data.password.length < 6) {
      throw new HttpsError(
        'invalid-argument',
        'Password must be at least 6 characters.'
      );
    }

    // Check if admin already exists
    const existingAdmins = await admin.firestore()
      .collection('admins')
      .where('email', '==', data.email)
      .get();

    if (!existingAdmins.empty) {
      throw new HttpsError(
        'already-exists',
        'An admin with this email already exists.'
      );
    }

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      photoURL: data.photoURL || undefined
    });

    // Create the admin document in Firestore
    const adminData = {
      uid: userRecord.uid,
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone || '',
      department: data.department || '',
      photoURL: data.photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.uid,
      isActive: true
    };

    await admin.firestore()
      .collection('admins')
      .doc(userRecord.uid)
      .set(adminData);

    return {
      success: true,
      uid: userRecord.uid,
      message: 'Admin created successfully',
      credentials: {
        email: data.email,
        password: data.password
      }
    };

  } catch (error: any) {
    console.error('Error creating admin:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError(
        'already-exists',
        'This email is already registered in the authentication system.'
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      throw new HttpsError(
        'invalid-argument',
        'Invalid email address.'
      );
    }
    
    if (error.code === 'auth/weak-password') {
      throw new HttpsError(
        'invalid-argument',
        'Password is too weak.'
      );
    }

    // Re-throw HttpsError
    if (error instanceof HttpsError) {
      throw error;
    }

    // Generic error
    throw new HttpsError(
      'internal',
      error.message || 'An error occurred while creating the admin.'
    );
  }
});