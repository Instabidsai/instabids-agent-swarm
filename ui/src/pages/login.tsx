// ui/src/pages/login.tsx
import { AuthComponent } from '@/components/Auth'
import { useRouter } from 'next/router'
import { useUser } from '@supabase/auth-helpers-react'

const LoginPage = () => {
    const user = useUser();
    const router = useRouter();

    if (user) {
        router.push('/dashboard');
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-xl shadow-lg border w-full max-w-lg">
                <h1 className="text-3xl font-bold text-center mb-6">Welcome to Instabids</h1>
                <AuthComponent />
            </div>
        </div>
    )
}

export default LoginPage