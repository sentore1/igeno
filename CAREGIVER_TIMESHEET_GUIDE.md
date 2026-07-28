# Caregiver Timesheet System - Complete Guide

## Overview

The Caregiver Timesheet System allows caregivers to log their work hours by checking in when they start work and checking out when they finish. The system automatically calculates hours worked and submits the information to administrators for review and approval.

## Features

### For Caregivers

1. **Check-In (Start Work)**
   - Log arrival time at office or client location
   - Optionally link to a specific booking
   - Add location and notes
   - System automatically records timestamp

2. **Check-Out (End Work)**
   - Log departure time when work is complete
   - Provide detailed work description
   - List all tasks completed during the shift
   - Add client feedback (optional)
   - System automatically calculates total hours worked

3. **Timesheet History**
   - View all past timesheets
   - See approval status
   - Review admin feedback
   - Track total hours worked

### For Administrators

1. **Timesheet Review Dashboard**
   - View all submitted timesheets
   - Filter by status (pending, approved, rejected)
   - Quick statistics overview
   - Detailed timesheet information

2. **Approval/Rejection**
   - Review caregiver work logs
   - Approve accurate timesheets
   - Reject with feedback for corrections
   - Add admin notes for record keeping

## Database Schema

### Timesheets Table

```sql
CREATE TABLE public.timesheets (
  id UUID PRIMARY KEY,
  caregiver_id UUID REFERENCES caregivers(id),
  booking_id UUID REFERENCES bookings(id),
  
  -- Check-in
  check_in_time TIMESTAMPTZ,
  check_in_location TEXT,
  check_in_notes TEXT,
  
  -- Check-out
  check_out_time TIMESTAMPTZ,
  check_out_location TEXT,
  check_out_notes TEXT,
  
  -- Work details
  total_hours DECIMAL(5,2), -- Automatically calculated
  work_description TEXT,
  tasks_completed TEXT[],
  client_feedback TEXT,
  
  -- Status workflow
  status TEXT, -- checked-in, checked-out, submitted, approved, rejected
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Installation & Setup

### Step 1: Run Database Migration

Execute the SQL script to create the timesheet system:

```bash
# Run in Supabase SQL Editor
./scripts/create-timesheet-system.sql
```

This will:
- Create the `timesheets` table
- Set up indexes for performance
- Configure Row Level Security (RLS) policies
- Add automatic timestamp triggers
- Create sample data for testing

### Step 2: Verify Installation

After running the script, verify:

1. Check that the table was created:
   ```sql
   SELECT * FROM public.timesheets LIMIT 1;
   ```

2. Verify RLS policies are active:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'timesheets';
   ```

## How to Use

### For Caregivers

#### Accessing the Timesheet Page

1. Log in as a caregiver
2. Go to your dashboard at `/dashboard/caregiver`
3. Click the "Work Log & Timesheets" button
4. You'll be taken to `/dashboard/caregiver/timesheets`

#### Checking In (Starting Work)

1. Fill out the check-in form:
   - **Location**: Where you're starting work (e.g., "Office", "Client Home - 123 Main St")
   - **Booking** (optional): Select from today's bookings if applicable
   - **Notes** (optional): Any relevant information about starting your shift

2. Click "Check In"

3. A green banner will appear confirming you're checked in

#### Checking Out (Ending Work)

Once checked in, the form will change to show check-out options:

1. Fill out the check-out form:
   - **Check-Out Location**: Where you're ending work
   - **Work Description** (required): Detailed description of work performed
   - **Tasks Completed**: Add individual tasks one by one (click "Add" after each)
   - **Client Feedback** (optional): Any feedback received from the client
   - **Additional Notes** (optional): Other relevant information

2. Review all information carefully

3. Click "Check Out & Submit"

4. The timesheet is now submitted to admin for review

#### Viewing Your History

Below the check-in/check-out form, you can:
- See all your past timesheets
- Filter by status
- View approval status
- Read admin feedback on rejected timesheets
- Track your total hours

### For Administrators

#### Accessing Timesheet Management

1. Log in as an admin
2. Go to `/dashboard/admin`
3. Click "Timesheet Management"
4. You'll be taken to `/dashboard/admin/timesheets`

#### Reviewing Timesheets

The dashboard shows:
- **Pending Review**: Timesheets awaiting approval (purple badge)
- **Approved**: Approved timesheets (green badge)
- **Rejected**: Rejected timesheets (red badge)
- **Total Hours**: Sum of all approved hours

#### Approving/Rejecting Timesheets

1. Click on any timesheet to view details

2. Review all information:
   - Caregiver details
   - Time in/out
   - Total hours
   - Work description
   - Tasks completed
   - Client feedback

3. Add review notes (required for rejection)

4. Click either:
   - **Approve**: Accept the timesheet as accurate
   - **Reject**: Send back for correction

5. The caregiver will see your feedback in their history

## API Endpoints

### GET /api/timesheets

Fetch timesheets for current user or all (if admin)

**Query Parameters:**
- `status` (optional): Filter by status

**Response:**
```json
{
  "timesheets": [
    {
      "id": "uuid",
      "caregiver_id": "uuid",
      "check_in_time": "2024-01-15T08:00:00Z",
      "check_out_time": "2024-01-15T16:00:00Z",
      "total_hours": 8.0,
      "status": "submitted",
      ...
    }
  ]
}
```

### POST /api/timesheets

Create new timesheet (check-in)

**Request Body:**
```json
{
  "booking_id": "uuid (optional)",
  "check_in_location": "Office",
  "check_in_notes": "Starting morning shift"
}
```

**Response:**
```json
{
  "timesheet": {
    "id": "uuid",
    "status": "checked-in",
    ...
  }
}
```

### PATCH /api/timesheets

Update timesheet (check-out or submit)

**Request Body:**
```json
{
  "timesheet_id": "uuid",
  "check_out_location": "Office",
  "check_out_notes": "Completed shift",
  "work_description": "Provided personal care...",
  "tasks_completed": ["Task 1", "Task 2"],
  "client_feedback": "Client was satisfied",
  "status": "submitted"
}
```

## Status Workflow

1. **checked-in**: Caregiver has started work
2. **checked-out**: Caregiver has ended work (internal state)
3. **submitted**: Timesheet submitted to admin
4. **approved**: Admin has approved the timesheet
5. **rejected**: Admin has rejected (needs correction)

## Security (Row Level Security)

The system uses Supabase RLS to ensure:

- Caregivers can only see their own timesheets
- Caregivers can only insert/update their own timesheets
- Caregivers cannot update approved/rejected timesheets
- Admins can view all timesheets
- Admins can approve/reject any timesheet

## Tips & Best Practices

### For Caregivers

1. ✅ Always check in when you start work
2. ✅ Provide detailed work descriptions
3. ✅ List all tasks you completed
4. ✅ Submit before leaving work
5. ✅ Add client feedback when available
6. ❌ Don't forget to check out

### For Administrators

1. ✅ Review timesheets promptly
2. ✅ Provide clear feedback when rejecting
3. ✅ Check for consistency with bookings
4. ✅ Verify reasonable hours
5. ✅ Use notes field for record keeping

## Troubleshooting

### Caregiver Issues

**Q: I can't check in**
- Verify you have a caregiver profile
- Check your internet connection
- Try refreshing the page

**Q: My timesheet doesn't show up**
- Check the filter status
- Verify you clicked "Submit" not just "Check Out"

**Q: I made a mistake on my timesheet**
- Contact admin to reject it so you can resubmit
- For future, review carefully before submitting

### Admin Issues

**Q: I can't see any timesheets**
- Verify you're logged in as admin
- Check if any timesheets have been submitted
- Try changing the filter to "All Status"

**Q: Can't approve/reject**
- Ensure you're viewing a "submitted" timesheet
- Check if you have admin permissions
- Try refreshing the page

## Future Enhancements

Potential additions to consider:

1. **Geolocation**: Automatic location capture
2. **Photos**: Upload photos of completed work
3. **Signatures**: Client signature on completion
4. **Export**: Download timesheets as PDF/Excel
5. **Reports**: Weekly/monthly timesheet reports
6. **Notifications**: Email/SMS when timesheet is reviewed
7. **Mobile App**: Dedicated mobile interface
8. **Overtime Tracking**: Highlight overtime hours
9. **Break Times**: Track breaks during shift
10. **GPS Verification**: Verify location accuracy

## Support

For issues or questions:
1. Check this guide first
2. Review the error message
3. Contact system administrator
4. Check browser console for technical errors

---

**Created**: 2026-07-28  
**Version**: 1.0  
**Maintained by**: System Administrator
