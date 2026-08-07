import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Generate a random 6-digit PIN
function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send PIN via email (you can customize this with your email service)
async function sendPINEmail(email: string, pin: string, fullName: string) {
  // For now, we'll use Supabase Auth's email system
  // You can integrate with SendGrid, Mailgun, or other services later
  
  // Note: In production, you should use a proper email service
  // This is a placeholder that logs the PIN
  console.log(`📧 Sending PIN to ${email}`);
  console.log(`   Name: ${fullName}`);
  console.log(`   PIN: ${pin}`);
  
  // TODO: Integrate with your email service
  // Example:
  // await sendGrid.send({
  //   to: email,
  //   from: 'noreply@yourplatform.com',
  //   subject: 'Your Caregiver Account Credentials',
  //   html: `
  //     <h2>Welcome ${fullName}!</h2>
  //     <p>Your caregiver account has been created.</p>
  //     <p><strong>Login PIN:</strong> ${pin}</p>
  //     <p>Please keep this PIN secure.</p>
  //   `
  // });
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, specialization, send_email } = body;

    // Verify admin access
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Check if a user with this email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;
    let pin: string;
    let isExistingUser = false;

    if (existingAuthUser) {
      // User already exists in auth — reuse their account
      userId = existingAuthUser.id;
      pin = '(existing account — user keeps their current password)';
      isExistingUser = true;

      // Update their role to caregiver in profile
      await (supabaseAdmin as any)
        .from('profiles')
        .update({ role: 'caregiver', full_name: full_name })
        .eq('id', userId);
    } else {
      // New user — create auth account
      pin = generatePIN();
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
        user_metadata: { full_name, role: 'caregiver' },
      });

      if (authError || !authUser.user) {
        console.error('Auth user creation error:', authError);
        return NextResponse.json(
          { error: `Failed to create auth user: ${authError?.message}` },
          { status: 400 }
        );
      }
      userId = authUser.user.id;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Note: Profile is automatically created by the database trigger (handle_new_user)
    // Wait a moment for the trigger to complete

    // Check if caregiver record already exists for this user
    const { data: existingCaregiver } = await (supabaseAdmin as any)
      .from('caregivers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingCaregiver) {
      return NextResponse.json(
        { error: 'A caregiver record already exists for this email address.' },
        { status: 400 }
      );
    }

    // Create caregiver record
    const { data: caregiver, error: caregiverError } = await (supabaseAdmin as any)
      .from('caregivers')
      .insert({
        user_id: userId,
        full_name: full_name,
        email: email,
        phone: phone,
        specialization: specialization || null,
        availability: [],
        rating: 0,
      })
      .select()
      .single();

    if (caregiverError) {
      console.error('Caregiver creation error:', caregiverError);
      // Only delete the auth user if we just created them
      if (!isExistingUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return NextResponse.json(
        { error: `Failed to create caregiver record: ${caregiverError.message}` },
        { status: 400 }
      );
    }

    // Send PIN via email if requested
    if (send_email) {
      try {
        await sendPINEmail(email, pin, full_name);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole operation if email fails
        // The admin will see the PIN in the response
      }
    }

    return NextResponse.json({
      success: true,
      message: isExistingUser
        ? 'Existing user linked as caregiver successfully'
        : 'Caregiver account created successfully',
      caregiver: caregiver,
      credentials: {
        email: email,
        pin: isExistingUser ? null : pin,
        note: isExistingUser
          ? 'This email already had an account. The user has been assigned the caregiver role.'
          : send_email
          ? 'PIN sent to caregiver email'
          : 'Please provide this PIN to the caregiver',
      },
    });

  } catch (error: any) {
    console.error('Caregiver creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
