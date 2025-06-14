// ui/src/components/Auth.tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabaseClient'

export const AuthComponent = () => (
  <div className="w-full max-w-md mx-auto">
    <Auth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={['google']}
      redirectTo="/"
      socialLayout="horizontal"
    />
  </div>
)
