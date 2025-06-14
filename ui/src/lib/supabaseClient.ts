// ui/src/lib/supabaseClient.ts
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react'

// This creates a singleton Supabase client for the browser.
export const supabase = createPagesBrowserClient()
