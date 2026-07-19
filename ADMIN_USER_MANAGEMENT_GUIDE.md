# Admin User Management Guide

## Overview
The Admin User Management page has been completely overhauled with full CRUD (Create, Read, Update, Delete) functionality.

## New Features

### 1. **Add User** ✨
- Click the **"+ Add User"** button in the top right
- Fill in the required information:
  - Full Name (required)
  - Email (required)
  - Role (required) - Choose from: Student, Caregiver, Nurse, Trainer, Consultant, Client, Admin
  - Phone (optional)
- Users are created with a temporary password: `TempPass123!`
- **Important:** Ask new users to reset their password on first login

### 2. **View User** 👁️
- Click **"View"** button on any user row
- See complete user information:
  - Full Name
  - Email
  - Role (with color-coded badge)
  - Phone (if available)
  - User ID
  - Join date
- Option to switch to Edit mode directly from View

### 3. **Edit User** ✏️
- Click **"Edit"** button on any user row
- Modify user information:
  - Full Name ✅
  - Role ✅
  - Phone ✅
  - Email ❌ (cannot be changed for security reasons)
- Changes are saved to the database immediately
- Success notification appears on save

### 4. **Delete User** 🗑️
- Click **"Delete"** button on any user row
- Confirmation dialog appears
- **Warning:** This action cannot be undone
- Note: This deletes the profile; auth user deletion requires Supabase admin access

### 5. **Search Functionality** 🔍
- New search bar at the top of the page
- Search by:
  - User's full name
  - Email address
- Real-time filtering as you type
- Works in combination with role filters

### 6. **Enhanced Summary** 📊
- Shows filtered count vs total count
- Example: "Showing 5 of 20 caregiver users"
- Updates dynamically based on filters and search

## User Interface Improvements

### Modal System
- All view/edit/add operations use clean modal dialogs
- Easy to close with X button or Cancel
- Form validation included
- Error messages displayed clearly

### Color-Coded Roles
- **Admin**: Red badge
- **Trainer**: Blue badge
- **Student**: Green badge
- **Caregiver**: Purple badge
- **Nurse**: Pink badge
- **Consultant**: Yellow badge
- **Client**: Gray badge

### Responsive Design
- Table scrolls horizontally on small screens
- Modal is responsive and scrollable
- Works on mobile, tablet, and desktop

## How to Use

### Adding a New User
1. Navigate to Admin Panel → User Management
2. Click **"+ Add User"** button
3. Fill in the form:
   ```
   Full Name: John Doe
   Email: john.doe@example.com
   Role: Caregiver
   Phone: +1234567890 (optional)
   ```
4. Click **"Create User"**
5. Note down the temporary password: `TempPass123!`
6. Share credentials with the new user
7. Ask them to reset their password on first login

### Viewing User Details
1. Find the user in the table
2. Click **"View"**
3. Review all user information
4. Click **"Edit User"** to modify or **"Close"** to exit

### Editing User Information
1. Find the user in the table
2. Click **"Edit"**
3. Modify the fields you want to change
4. Click **"Save Changes"**
5. Confirmation message will appear

### Searching for Users
1. Type in the search box at the top
2. Search works for both names and emails
3. Combine with role filters for precise results

### Filtering by Role
1. Use the role filter buttons
2. Click any role to see only those users
3. Click **"All Users"** to see everyone

## Security Notes

### User Creation
- Temporary password is shown only once
- Users MUST reset password on first login
- Email is unique and cannot be duplicated

### User Deletion
- Deletes the profile from the database
- Auth user remains in Supabase Auth
- For complete deletion, use Supabase dashboard

### Permissions
- Only admins can access this page
- Non-admin users are redirected to their dashboard
- Unauthenticated users are sent to sign-in

## Technical Details

### Database Operations
- **Create**: Uses `supabase.auth.signUp()` + profile update
- **Read**: Queries `profiles` table
- **Update**: Updates `profiles` table only
- **Delete**: Removes from `profiles` table

### Form Validation
- Required fields marked with *
- Email format validation
- Phone format validation (optional)
- Error messages for failed operations

### State Management
- Real-time updates after operations
- Loading states for async operations
- Form state management with React hooks

## Troubleshooting

### User Creation Fails
- Check email is unique
- Verify Supabase connection
- Check RLS policies on profiles table

### Cannot Edit User
- Verify you have admin role
- Check Supabase policies allow updates
- Ensure user exists in database

### Search Not Working
- Refresh the page
- Check for JavaScript errors in console
- Verify data is loading correctly

## Future Enhancements (Potential)

- Bulk user operations
- Export user list to CSV
- Advanced filtering (by date, status)
- User activity logs
- Password reset from admin panel
- Email verification status
- Bulk import from CSV
- User suspension/activation

## Related Files

- Page Component: `app/dashboard/admin/users/page.tsx`
- Types: `lib/types.ts`
- Supabase Client: `lib/supabase-client.ts`

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check RLS policies
4. Review error messages in modals
5. Check network tab for failed requests

---

**Last Updated:** July 19, 2026
**Version:** 2.0
**Status:** ✅ Production Ready
