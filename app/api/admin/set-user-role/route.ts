import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { targetEmail, role, permissions } = await request.json()
    
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )
    
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .single()
    
    if (error || !data) {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                email: targetEmail,
                role,
                can_scout: permissions.can_scout,
                can_view_analytics: permissions.can_view_analytics,
                can_manage_data: permissions.can_manage_data,
                can_manage_users: permissions.can_manage_users,
                role_updated_at: new Date().toISOString()
            })
        
        if (insertError) {
            return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true })
    }
    
    // Profile exists, update it
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            role,
            can_scout: permissions.can_scout,
            can_view_analytics: permissions.can_view_analytics,
            can_manage_data: permissions.can_manage_data,
            can_manage_users: permissions.can_manage_users,
            role_updated_at: new Date().toISOString()
        })
        .eq('email', targetEmail)
    
    if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
}
