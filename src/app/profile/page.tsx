// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase/client';
import { doc, setDoc, getDoc, updateDoc, collection, query, getDocs, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { User, Camera, Save, X, Plus, Trash2, Shield, Mail, UserCog, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential , createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

interface AdminData {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff';
  photoURL?: string;
  phone?: string;
  department?: string;
  createdAt: any;
}

const ROLE_HIERARCHY = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  staff: 1
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff'
};

export default function ProfilePage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<AdminData | null>(null);
  const [allAdmins, setAllAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'manage'>('profile');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
 const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
  });
 const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  
  // Add admin state
  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);
  const [editAdminData, setEditAdminData] = useState({
  name: '',
  phone: '',
  department: '',
  role: 'staff' as AdminData['role']
  });

  const [editAdminPhoto, setEditAdminPhoto] = useState<File | null>(null);
const [editAdminPhotoPreview, setEditAdminPhotoPreview] = useState<string>('');

// ADD THE NEW STATE HERE:
const [showAddAdmin, setShowAddAdmin] = useState(false);
const [newAdmin, setNewAdmin] = useState({
  name: '',
  email: '',
  password: '',
  role: 'staff' as AdminData['role'],
  phone: '',
  department: ''
});
const [newAdminPhoto, setNewAdminPhoto] = useState<File | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    // Try to fetch by UID first (new method)
    const currentAdminDoc = await getDoc(doc(db, 'admins', user.uid));
    let current: AdminData | undefined;

    if (currentAdminDoc.exists()) {
      current = {
        id: currentAdminDoc.id,
        ...currentAdminDoc.data()
      } as AdminData;
    } else {
      // Fallback: search by email (for old admins)
      const adminsQuery = query(
        collection(db, 'admins'),
        where('email', '==', user.email)
      );
      const adminsSnapshot = await getDocs(adminsQuery);
      
      if (!adminsSnapshot.empty) {
        const adminDoc = adminsSnapshot.docs[0];
        current = {
          id: adminDoc.id,
          ...adminDoc.data()
        } as AdminData;
      }
    }

    if (!current) {
      throw new Error('Admin not found');
    }

    setCurrentAdmin(current);
    setFormData({
      name: current.name,
      email: current.email,
      phone: current.phone || '',
      department: current.department || ''
    });
    setPhotoPreview(current.photoURL || '');
    
    // Fetch all admins
    const allAdminsSnapshot = await getDocs(collection(db, 'admins'));
    const admins = allAdminsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AdminData[];
    
    if (ROLE_HIERARCHY[current.role] >= ROLE_HIERARCHY.admin) {
      setAllAdmins(admins.filter(a => a.id !== current.id));
    }
    
    setLoading(false);
  } catch (error) {
    console.error('Error fetching admin data:', error);
    setLoading(false);
  }
};

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.1, // 100KB max
      maxWidthOrHeight: 400,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentAdmin) return;
    
    setSaving(true);
    try {
      let photoURL = currentAdmin.photoURL;

      // Upload new photo if changed
      if (photoFile) {
        // Delete old photo if exists
        if (currentAdmin.photoURL) {
          try {
            const oldRef = ref(storage, currentAdmin.photoURL);
            await deleteObject(oldRef);
          } catch (error) {
            console.log('Old photo not found or already deleted');
          }
        }

        // Upload new photo
        const photoRef = ref(storage, `admins/${currentAdmin.id}/profile.jpg`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      // Update Firestore
      await updateDoc(doc(db, 'admins', currentAdmin.id), {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        photoURL: photoURL,
        updatedAt: Timestamp.now()
      });

      setCurrentAdmin({
        ...currentAdmin,
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        photoURL: photoURL
      });

      setEditMode(false);
      setPhotoFile(null);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
  if (!currentAdmin) {
    alert('You must be logged in to add admins.');
    return;
  }

  if (ROLE_HIERARCHY[currentAdmin.role] < ROLE_HIERARCHY.admin) {
    alert('You do not have permission to add admins.');
    return;
  }

  if (currentAdmin.role === 'admin' && 
      (newAdmin.role === 'super_admin' || newAdmin.role === 'admin')) {
    alert('You can only create Manager or Staff accounts.');
    return;
  }

  if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
    alert('Name, email, and password are required.');
    return;
  }

  if (newAdmin.password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newAdmin.email)) {
    alert('Please enter a valid email address.');
    return;
  }

  setSaving(true);
  try {
    // Check if admin already exists in Firestore
    const existingAdminsQuery = query(
      collection(db, 'admins'),
      where('email', '==', newAdmin.email)
    );
    const existingAdmins = await getDocs(existingAdminsQuery);
    
    if (!existingAdmins.empty) {
      alert('An admin with this email already exists.');
      setSaving(false);
      return;
    }
   // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + 'Aa1!';
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      newAdmin.email,
      tempPassword
    );

    let photoURL = '';
    if (newAdminPhoto) {
      const compressed = await compressImage(newAdminPhoto);
      const photoRef = ref(storage, `admins/${userCredential.user.uid}/profile.jpg`);
      await uploadBytes(photoRef, compressed);
      photoURL = await getDownloadURL(photoRef);
    }

    // Create admin document with the Auth UID
    const adminData = {
      uid: userCredential.user.uid,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      phone: newAdmin.phone || '',
      department: newAdmin.department || '',
      photoURL: photoURL || '',
      createdAt: Timestamp.now(),
      createdBy: currentAdmin.id,
      isActive: true
    };

   await setDoc(doc(db, 'admins', userCredential.user.uid), adminData);

   try {
      await sendPasswordResetEmail(auth, newAdmin.email);
      alert(`✅ Admin created successfully!\n\nA password setup email has been sent to ${newAdmin.email}`);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      alert(`⚠️ Admin created, but email failed to send.\n\nPlease use "Reset Password" button.`);
    }
    
    setShowAddAdmin(false);
    setNewAdmin({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
      department: ''
    });
    setNewAdminPhoto(null);
    
    await fetchAdminData();
    alert(`Admin created successfully! Login credentials have been set.`);
  } catch (error: any) {
    console.error('Error adding admin:', error);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        alert('This email is already registered in the authentication system.');
        break;
      case 'auth/weak-password':
        alert('Password is too weak. Please use a stronger password.');
        break;
      default:
        alert(`Error: ${error.message}`);
    }
  } finally {
    setSaving(false);
  }
};

// Add handleEditAdmin function
const handleStartEditAdmin = (admin: AdminData) => {
  setEditingAdmin(admin);
  setEditAdminData({
    name: admin.name,
    phone: admin.phone || '',
    department: admin.department || '',
    role: admin.role
  });
  setEditAdminPhotoPreview(admin.photoURL || '');
  setEditAdminPhoto(null);
};

const handleSaveEditAdmin = async () => {
  if (!editingAdmin || !currentAdmin) return;

  // Check if user can edit this admin's role
  if (ROLE_HIERARCHY[currentAdmin.role] <= ROLE_HIERARCHY[editingAdmin.role]) {
    alert('You cannot edit admins at your level or higher.');
    return;
  }

  // Check if role change is allowed
  if (currentAdmin.role === 'admin' && 
      (editAdminData.role === 'super_admin' || editAdminData.role === 'admin')) {
    alert('You can only assign Manager or Staff roles.');
    return;
  }

  setSaving(true);
  try {
    let photoURL = editingAdmin.photoURL;

    // Upload new photo if changed
    if (editAdminPhoto) {
      // Delete old photo if exists
      if (editingAdmin.photoURL) {
        try {
          const oldRef = ref(storage, editingAdmin.photoURL);
          await deleteObject(oldRef);
        } catch (error) {
          console.log('Old photo not found');
        }
      }

      const photoRef = ref(storage, `admins/${editingAdmin.id}/profile.jpg`);
      await uploadBytes(photoRef, editAdminPhoto);
      photoURL = await getDownloadURL(photoRef);
    }

    // Update Firestore
    await updateDoc(doc(db, 'admins', editingAdmin.id), {
      name: editAdminData.name,
      phone: editAdminData.phone,
      department: editAdminData.department,
      role: editAdminData.role,
      photoURL: photoURL,
      updatedAt: Timestamp.now(),
      updatedBy: currentAdmin.id
    });

    setEditingAdmin(null);
    setEditAdminPhoto(null);
    setEditAdminPhotoPreview('');
    
    await fetchAdminData();
    alert('Admin updated successfully!');
  } catch (error) {
    console.error('Error updating admin:', error);
    alert('Error updating admin. Please try again.');
  } finally {
    setSaving(false);
  }
};

const handleResetPassword = async (adminEmail: string) => {
  if (!confirm(`Send password reset email to ${adminEmail}?`)) return;

  try {
    await sendPasswordResetEmail(auth, adminEmail);
    alert(`Password reset email sent to ${adminEmail}`);
  } catch (error: any) {
    console.error('Error sending reset email:', error);
    alert(`Error: ${error.message}`);
  }
};


  const handleDeleteAdmin = async (adminId: string, adminRole: AdminData['role']) => {
    if (!currentAdmin) return;

    // Super admin can delete anyone except other super admins
    // Admin can only delete lower roles
    if (currentAdmin.role === 'super_admin' && adminRole === 'super_admin') {
      alert('Cannot delete another super admin.');
      return;
    }

    if (ROLE_HIERARCHY[currentAdmin.role] <= ROLE_HIERARCHY[adminRole]) {
      alert('You cannot delete admins at your level or higher.');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin?')) return;

    setSaving(true);
    try {
      const adminDoc = await getDoc(doc(db, 'admins', adminId));
      const adminData = adminDoc.data();

      // Delete photo if exists
      if (adminData?.photoURL) {
        try {
          const photoRef = ref(storage, adminData.photoURL);
          await deleteObject(photoRef);
        } catch (error) {
          console.log('Photo not found or already deleted');
        }
      }

      await deleteDoc(doc(db, 'admins', adminId));
      await fetchAdminData();
      alert('Admin deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Error deleting admin. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const canManageAdmin = (targetRole: AdminData['role']) => {
    if (!currentAdmin) return false;
    return ROLE_HIERARCHY[currentAdmin.role] > ROLE_HIERARCHY[targetRole];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

// Replace your handleChangePassword function with this improved version:

const handleChangePassword = async () => {
  if (!passwordData.newPassword || !passwordData.currentPassword || !passwordData.confirmPassword) {
    alert('Please fill in all password fields');
    return;
  }

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    alert('New passwords do not match');
    return;
  }

  if (passwordData.newPassword.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  setChangingPassword(true);
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(
      user.email,
      passwordData.currentPassword
    );
    
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, passwordData.newPassword);

    alert('Password changed successfully!');
    setShowPasswordChange(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    
    // Provide specific error messages
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        alert('Current password is incorrect. Please try again.');
        break;
      case 'auth/invalid-login-credentials':
        alert('Current password is incorrect. Please verify and try again.');
        break;
      case 'auth/user-not-found':
        alert('User account not found. Please contact support.');
        break;
      case 'auth/requires-recent-login':
        alert('For security reasons, please log out and log in again before changing your password.');
        break;
      case 'auth/weak-password':
        alert('New password is too weak. Please use a stronger password.');
        break;
      case 'auth/too-many-requests':
        alert('Too many failed attempts. Please try again later.');
        break;
      default:
        alert(error.message || 'Failed to change password. Please try again.');
    }
  } finally {
    setChangingPassword(false);
  }
};

  if (!currentAdmin) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
              <p className="text-gray-600 mt-1">Manage your profile and admin users</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-1 inline-flex gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            My Profile
          </button>
          {ROLE_HIERARCHY[currentAdmin.role] >= ROLE_HIERARCHY.admin && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'manage'
                  ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserCog className="w-4 h-4 inline mr-2" />
              Manage Admins
            </button>
          )}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
            <>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Photo */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="relative inline-block">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt={currentAdmin.name}
                        className="w-48 h-48 rounded-full object-cover border-4 border-amber-500 shadow-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center border-4 border-amber-500 shadow-lg">
                        <span className="text-6xl font-bold text-white">
                          {getInitials(currentAdmin.name)}
                        </span>
                      </div>
                    )}
                    {editMode && (
                      <label className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Camera className="w-6 h-6 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                      currentAdmin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                      currentAdmin.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                      currentAdmin.role === 'manager' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">{ROLE_LABELS[currentAdmin.role]}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                 <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter password (min 6 characters)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                    placeholder="+91 1234567890"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!editMode}
                    placeholder="e.g., Operations, Sales, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                {editMode && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          name: currentAdmin.name,
                          email: currentAdmin.email,
                          phone: currentAdmin.phone || '',
                          department: currentAdmin.department || ''
                        });
                        setPhotoPreview(currentAdmin.photoURL || '');
                        setPhotoFile(null);
                      }}
                      disabled={saving}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>   
            </div>    
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security</h2>
          <p className="text-gray-600 mt-1">Manage your password and security settings</p>
        </div>
      </div>

      {!showPasswordChange ? (
        <button
          onClick={() => setShowPasswordChange(true)}
          className="px-4 py-2 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center gap-2"
        >
          <Shield className="w-5 h-5" />
          Change Password
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password *
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-6 py-3 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
            <button
              onClick={() => {
                setShowPasswordChange(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              }}
              disabled={changingPassword}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  </>
)}

        {/* Manage Admins Tab */}
        {activeTab === 'manage' && ROLE_HIERARCHY[currentAdmin.role] >= ROLE_HIERARCHY.admin && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Admins</h2>
                <p className="text-gray-600 mt-1">Add, edit, or remove admin users</p>
              </div>
              <button
                onClick={() => setShowAddAdmin(true)}
                className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Admin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allAdmins.map((admin) => (
  <div key={admin.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
    <div className="flex flex-col items-center text-center">
      {admin.photoURL ? (
        <img
          src={admin.photoURL}
          alt={admin.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 mb-4"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-linear-to-br from-gray-400 to-gray-600 flex items-center justify-center border-4 border-gray-200 mb-4">
          <span className="text-3xl font-bold text-white">
            {getInitials(admin.name)}
          </span>
        </div>
      )}
      
      <h3 className="text-lg font-bold text-gray-900 mb-1">{admin.name}</h3>
      <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
        <Mail className="w-4 h-4" />
        {admin.email}
      </p>
      
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
        admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
        admin.role === 'admin' ? 'bg-blue-100 text-blue-700' :
        admin.role === 'manager' ? 'bg-green-100 text-green-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        <Shield className="w-3 h-3" />
        {ROLE_LABELS[admin.role]}
      </div>

      {admin.department && (
        <p className="text-xs text-gray-500 mb-4">{admin.department}</p>
      )}

      <div className="w-full space-y-2">
        {canManageAdmin(admin.role) && (
          <>
            <button
              onClick={() => handleStartEditAdmin(admin)}
              disabled={saving}
              className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              <UserCog className="w-4 h-4" />
              Edit Admin
            </button>
            
            <button
              onClick={() => handleResetPassword(admin.email)}
              disabled={saving}
              className="w-full px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              Reset Password
            </button>
            
            <button
              onClick={() => handleDeleteAdmin(admin.id, admin.role)}
              disabled={saving}
              className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Remove Admin
            </button>
          </>
        )}
      </div>
    </div>
  </div>
))}
            </div>
          </div>
        )}

        {/* Add Admin Modal */}
        {showAddAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Add New Admin</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    {newAdminPhoto ? (
                      <img
                        src={URL.createObjectURL(newAdminPhoto)}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-amber-500"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50">
                      <Camera className="w-5 h-5 text-gray-600" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await compressImage(file);
                            setNewAdminPhoto(compressed);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Temporary Password *
  </label>
  <input
    type="password"
    value={newAdmin.password}
    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    placeholder="Enter temporary password (min 6 characters)"
  />
  <p className="text-xs text-gray-500 mt-1">
    Admin will use this to login. They can change it later.
  </p>
</div>

                <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Role *
  </label>
  <select
    value={newAdmin.role}
    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminData['role'] })}
    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
  >
    {Object.entries(ROLE_LABELS).map(([value, label]) => {
      // Super admin can assign any role
      if (currentAdmin.role === 'super_admin') {
        return <option key={value} value={value}>{label}</option>;
      }
      // Admin can only assign manager and staff
      if (currentAdmin.role === 'admin' && (value === 'manager' || value === 'staff')) {
        return <option key={value} value={value}>{label}</option>;
      }
      return null;
    })}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    {currentAdmin.role === 'super_admin' 
      ? 'You can assign any role' 
      : 'You can only create Manager or Staff accounts'}
  </p>
</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="+91 1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newAdmin.department}
                    onChange={(e) => setNewAdmin({ ...newAdmin, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="e.g., Operations, Sales, etc."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleAddAdmin}
                  disabled={saving || !newAdmin.name || !newAdmin.email}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {saving ? 'Adding...' : 'Add Admin'}
                </button>
                <button
                  onClick={() => {
                    setShowAddAdmin(false);
                    setNewAdmin({
                      name: '',
                      email: '',
                      password: '',
                      role: 'staff',
                      phone: '',
                      department: ''
                    });
                    setNewAdminPhoto(null);
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

         {/* Edit Admin Modal */}
        {editingAdmin && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900">Edit Admin</h3>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="relative inline-block">
            {editAdminPhotoPreview ? (
              <img
                src={editAdminPhotoPreview}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-amber-500"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50">
              <Camera className="w-5 h-5 text-gray-600" />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const compressed = await compressImage(file);
                    setEditAdminPhoto(compressed);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setEditAdminPhotoPreview(reader.result as string);
                    };
                    reader.readAsDataURL(compressed);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={editAdminData.name}
            onChange={(e) => setEditAdminData({ ...editAdminData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={editingAdmin.email}
            disabled
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role *
          </label>
          <select
            value={editAdminData.role}
            onChange={(e) => setEditAdminData({ ...editAdminData, role: e.target.value as AdminData['role'] })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => {
              if (currentAdmin.role === 'super_admin') {
                return <option key={value} value={value}>{label}</option>;
              }
              if (currentAdmin.role === 'admin' && (value === 'manager' || value === 'staff')) {
                return <option key={value} value={value}>{label}</option>;
              }
              return null;
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={editAdminData.phone}
            onChange={(e) => setEditAdminData({ ...editAdminData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            type="text"
            value={editAdminData.department}
            onChange={(e) => setEditAdminData({ ...editAdminData, department: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex gap-3">
        <button
          onClick={handleSaveEditAdmin}
          disabled={saving || !editAdminData.name}
          className="flex-1 px-6 py-3 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setEditAdminPhoto(null);
            setEditAdminPhotoPreview('');
          }}
          disabled={saving}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </div>
  </div>
)}



      </div>
      </div>
      );
      }