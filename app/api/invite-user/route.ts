import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        // 1. Verify Secret Header for Security
        const secret = req.headers.get('x-n8n-secret');
        const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

        // If no secret is set in env, block everything for safety
        if (!expectedSecret) {
            console.error("❌ N8N_WEBHOOK_SECRET is not set in environment variables.");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (secret !== expectedSecret) {
            console.warn("⛔ Unauthorized attempt to access invite-user API");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();
        const { email, firstName, lastName } = body;

        if (!email) {
            return NextResponse.json({ error: 'Missing email' }, { status: 400 });
        }

        console.log(`📧 Inviting user: ${email}`);

        // 3. Invite User via Supabase Admin
        const supabaseAdmin = createAdminClient();

        // Determine the redirect URL (Production vs Local)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                first_name: firstName,
                last_name: lastName,
                // Add any other user metadata here
            },
            redirectTo: `${siteUrl}/update-password`
        });

        if (error) {
            console.error("❌ Supabase Invite Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("✅ User invited successfully:", data.user.id);

        return NextResponse.json({
            success: true,
            message: 'Invitation sent',
            userId: data.user.id
        });

    } catch (error: any) {
        console.error('❌ Internal Server Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
