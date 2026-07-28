import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch timesheets for current user or all (if admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('timesheets')
      .select(`
        *,
        caregivers (
          id,
          full_name,
          email,
          phone,
          specialization
        ),
        bookings (
          id,
          service_type,
          scheduled_date,
          scheduled_time,
          clients (
            full_name,
            email,
            phone,
            address
          )
        )
      `)
      .order('check_in_time', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // If not admin, only show their own timesheets
    if (profile?.role !== 'admin') {
      const { data: caregiver } = await supabase
        .from('caregivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!caregiver) {
        return NextResponse.json({ error: 'Caregiver profile not found' }, { status: 404 });
      }

      query = query.eq('caregiver_id', caregiver.id);
    }

    const { data: timesheets, error } = await query;

    if (error) {
      console.error('Error fetching timesheets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timesheets });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new timesheet (check-in)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get caregiver profile
    const { data: caregiver, error: caregiverError } = await supabase
      .from('caregivers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (caregiverError || !caregiver) {
      return NextResponse.json({ error: 'Caregiver profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      booking_id,
      check_in_location,
      check_in_notes,
    } = body;

    // Block more than 1 check-in per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: existingToday } = await supabase
      .from('timesheets')
      .select('id')
      .eq('caregiver_id', caregiver.id)
      .gte('check_in_time', todayStart.toISOString())
      .lte('check_in_time', todayEnd.toISOString())
      .limit(1);

    if (existingToday && existingToday.length > 0) {
      return NextResponse.json({ error: 'You have already checked in today. Only 1 check-in is allowed per day.' }, { status: 400 });
    }

    // Create new timesheet entry
    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .insert({
        caregiver_id: caregiver.id,
        booking_id: booking_id || null,
        check_in_location,
        check_in_notes,
        status: 'checked-in',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating timesheet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timesheet }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update timesheet (check-out or submit)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      timesheet_id,
      check_out_location,
      check_out_notes,
      work_description,
      tasks_completed,
      client_feedback,
      status,
    } = body;

    if (!timesheet_id) {
      return NextResponse.json({ error: 'Timesheet ID is required' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (check_out_location !== undefined) updateData.check_out_location = check_out_location;
    if (check_out_notes !== undefined) updateData.check_out_notes = check_out_notes;
    if (work_description !== undefined) updateData.work_description = work_description;
    if (tasks_completed !== undefined) updateData.tasks_completed = tasks_completed;
    if (client_feedback !== undefined) updateData.client_feedback = client_feedback;
    if (status !== undefined) updateData.status = status;

    // If checking out, set check_out_time and calculate total_hours
    if (status === 'checked-out' || status === 'submitted') {
      const checkOutTime = new Date();
      updateData.check_out_time = checkOutTime.toISOString();

      // Fetch check_in_time to calculate hours
      const { data: existing } = await supabase
        .from('timesheets')
        .select('check_in_time')
        .eq('id', timesheet_id)
        .single();

      if (existing?.check_in_time) {
        const diffMs = checkOutTime.getTime() - new Date(existing.check_in_time).getTime();
        updateData.total_hours = parseFloat((diffMs / 3600000).toFixed(4));
      }
    }

    // Update timesheet
    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .update(updateData)
      .eq('id', timesheet_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timesheet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ timesheet });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
