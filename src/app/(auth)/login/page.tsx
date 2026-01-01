// src/app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login - Coffee Admin',
  description: 'Sign in to access the admin dashboard',
};

export default function LoginPage() {
  return <LoginForm />;
}