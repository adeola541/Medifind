'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingApproval, setPendingApproval] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
        if (pendingApproval) setPendingApproval(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', formData);
            const { token, user } = response.data;

            // Store token and user info
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect based on role
            if (user.role === 'SUPER_ADMIN') {
                router.push('/dashboard/admin');
            } else if (user.role === 'PHARMACY_ADMIN') {
                router.push('/dashboard/pharmacy');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 403 && err.response?.data?.error?.includes('pending approval')) {
                setPendingApproval(true);
            } else {
                setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding & Image */}
            <div className="hidden lg:flex flex-col relative bg-emerald-900 text-white p-12 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-217358c7e618?q=80&w=2000')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <img src="/logo-icon.png" alt="MediFind Logo" className="w-8 h-8 rounded-lg object-contain" />
                            <h1 className="text-2xl font-bold tracking-tight">MediFind</h1>
                        </div>
                        <p className="text-emerald-100/80">Pharmacy Management System</p>
                    </div>
                    <div>
                        <blockquote className="text-2xl font-medium leading-relaxed mb-6">
                            "Streamlining pharmaceutical access and verification across the network."
                        </blockquote>
                        <div className="flex items-center gap-4 text-sm font-medium text-emerald-200">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-emerald-900 bg-gray-200" />
                                <div className="w-8 h-8 rounded-full border-2 border-emerald-900 bg-gray-300" />
                                <div className="w-8 h-8 rounded-full border-2 border-emerald-900 bg-gray-400" />
                            </div>
                            <span>Trusted by 500+ Pharmacies</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-sm space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
                        <p className="mt-2 text-gray-500">Sign in to your dashboard to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <Link href="#" className="text-sm text-emerald-600 hover:text-emerald-500 font-medium">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={loading}>
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                                </>
                            )}
                        </Button>
                    </form>

                    {pendingApproval && (
                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex flex-col gap-2 animate-in fade-in zoom-in-95">
                            <div className="flex items-center gap-2 font-semibold">
                                <ShieldAlert className="w-5 h-5 text-yellow-600" />
                                Approval Pending
                            </div>
                            <p className="text-yellow-700/90 ml-7">
                                Your pharmacy account is currently under review.
                                Please wait for an administrator to verify your documents and license.
                            </p>
                        </div>
                    )}

                    {error && !pendingApproval && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-center gap-2 animate-in fade-in zoom-in-95">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    <p className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
