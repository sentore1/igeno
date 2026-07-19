# Admin User Actions - Visual Guide

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  User Management              [+ Add User] [Back to Admin]   │
├─────────────────────────────────────────────────────────────┤
│  [Search by name or email...]                                │
│  Filter: [All Users] [Admin] [Trainer] [Student] ...        │
├─────────────────────────────────────────────────────────────┤
│  USER    EMAIL           ROLE        JOINED      ACTIONS     │
│  ────────────────────────────────────────────────────────── │
│  👤 John   john@...     Caregiver   7/19/26    [V] [E] [D]  │
│  👤 Jane   jane@...     Admin       7/18/26    [V] [E] [D]  │
└─────────────────────────────────────────────────────────────┘
```

Legend:
- [V] = View button (blue)
- [E] = Edit button (green)
- [D] = Delete button (red)

## Action Buttons

### 1. 🔵 View Button

**What it does:**
- Opens a modal showing complete user information
- Read-only display of all user data
- Option to switch to Edit mode

**What you see:**
```
┌─────────────────────────────────┐
│ View User                    [X]│
├─────────────────────────────────┤
│ Full Name: John Doe             │
│ Email: john@example.com         │
│ Role: [Caregiver badge]         │
│ Phone: +1234567890              │
│ User ID: abc-123-def            │
│ Joined: July 19, 2026           │
├─────────────────────────────────┤
│ [Edit User] [Close]             │
└─────────────────────────────────┘
```

**When to use:**
- Checking user details quickly
- Verifying user information
- Getting user ID for troubleshooting

---

### 2. 🟢 Edit Button

**What it does:**
- Opens a modal with editable form
- Allows changing name, role, phone
- Email is locked (cannot change)
- Saves changes to database

**What you see:**
```
┌─────────────────────────────────┐
│ Edit User                    [X]│
├─────────────────────────────────┤
│ Full Name: [John Doe        ]   │
│ Email: john@example.com 🔒      │
│ Role: [▼ Caregiver         ]    │
│ Phone: [+1234567890        ]    │
├─────────────────────────────────┤
│ [Save Changes] [Cancel]         │
└─────────────────────────────────┘
```

**When to use:**
- Correcting user name typos
- Changing user role
- Updating phone number
- Promoting user to admin

**What can be changed:**
- ✅ Full Name
- ✅ Role
- ✅ Phone
- ❌ Email (locked)

---

### 3. 🟥 Delete Button

**What it does:**
- Shows confirmation dialog
- Deletes user profile from database
- Cannot be undone
- Auth user remains (needs Supabase admin to fully delete)

**What you see:**
```
┌─────────────────────────────────┐
│ ⚠️  Confirm Delete              │
├─────────────────────────────────┤
│ Are you sure you want to delete │
│ user "John Doe"?                │
│                                  │
│ This action cannot be undone.   │
├─────────────────────────────────┤
│ [OK] [Cancel]                   │
└─────────────────────────────────┘
```

**When to use:**
- Removing test accounts
- Cleaning up duplicate accounts
- Removing inactive users

**⚠️ Warning:**
- Action is permanent
- Profile data will be lost
- User cannot log in after deletion

---

### 4. ➕ Add User Button

**What it does:**
- Opens modal to create new user
- Creates auth account + profile
- Assigns temporary password
- Sets initial role

**What you see:**
```
┌─────────────────────────────────┐
│ Add New User                 [X]│
├─────────────────────────────────┤
│ Full Name: [              ] *   │
│ Email: [                  ] *   │
│ Role: [▼ Student          ] *   │
│ Phone: [                  ]     │
├─────────────────────────────────┤
│ ⚠️ Note: User will be created   │
│ with password: TempPass123!     │
│ Ask them to reset on first login│
├─────────────────────────────────┤
│ [Create User] [Cancel]          │
└─────────────────────────────────┘
```

**When to use:**
- Adding new team members
- Creating accounts for clients
- Setting up caregiver accounts
- Creating admin users

**After creation:**
- Share email: `user@example.com`
- Share password: `TempPass123!`
- Ask to reset password ASAP

---

## Search Bar

**What it does:**
- Filters users in real-time
- Searches by name AND email
- Works with role filters

**Example searches:**
```
Search: "john"      → Finds "John Doe", "Johnathan Smith"
Search: "@gmail"    → Finds all Gmail users
Search: "caregiver" → Finds users with "caregiver" in name
```

---

## Role Filter Buttons

**What they do:**
- Filter table by user role
- Show count in summary
- Can combine with search

**All available roles:**
```
[All Users]    → Shows everyone
[Admin]        → Red badge users
[Trainer]      → Blue badge users
[Student]      → Green badge users
[Caregiver]    → Purple badge users
[Nurse]        → Pink badge users
[Consultant]   → Yellow badge users
[Client]       → Gray badge users
```

**Active state:**
- Selected button is blue with white text
- Unselected buttons are gray

---

## Common Workflows

### Add a New Caregiver
```
1. Click [+ Add User]
2. Enter name: "Jane Smith"
3. Enter email: "jane.smith@example.com"
4. Select role: "Caregiver"
5. Enter phone: "+1234567890"
6. Click [Create User]
7. Note password: TempPass123!
8. Share credentials with Jane
```

### Change Someone's Role
```
1. Find user in table
2. Click [Edit] (green button)
3. Change role dropdown
4. Click [Save Changes]
5. ✅ Done!
```

### Find a Specific User
```
Method 1: Search
1. Type name in search box
2. User appears instantly

Method 2: Filter + Scroll
1. Click role filter button
2. Scroll through filtered list
3. Click [View] when found
```

### Remove a Test Account
```
1. Find user in table
2. Click [Delete] (red button)
3. Confirm in dialog
4. ✅ User removed
```

---

## Keyboard Shortcuts

While modals are open:
- `ESC` - Close modal
- `Enter` - Submit form (Add/Edit only)

---

## Mobile Experience

On mobile devices:
- Table scrolls horizontally
- Modals are full-screen responsive
- All buttons remain accessible
- Search works the same

---

## Error Messages

### Common errors you might see:

**"Failed to create user"**
- Email already exists
- Invalid email format
- Network issue

**"Failed to update user"**
- Network issue
- Permission denied
- User doesn't exist

**"Failed to delete user"**
- User doesn't exist
- Permission denied
- Network issue

---

## Summary Section

At the bottom of the page:
```
┌─────────────────────────────────┐
│ Summary                          │
│ Showing 5 of 20 caregiver users │
└─────────────────────────────────┘
```

Shows:
- Number of filtered results
- Total number of users
- Active filter (if any)

---

## Best Practices

### ✅ DO:
- Search before adding to avoid duplicates
- Use View before Edit to confirm identity
- Always confirm before Delete
- Share passwords securely
- Ask users to reset passwords immediately

### ❌ DON'T:
- Delete users without backup
- Create users without confirming details
- Share passwords in plain text emails
- Change roles without authorization
- Delete active admin accounts

---

## Quick Reference Card

| Action | Button | Color | Result |
|--------|--------|-------|--------|
| View Details | View | Blue | Opens read-only modal |
| Edit Info | Edit | Green | Opens editable form |
| Remove User | Delete | Red | Confirms then deletes |
| Add User | + Add User | Blue | Creates new account |
| Search | Text field | - | Filters table |
| Filter | Role buttons | Gray/Blue | Shows by role |

---

**Need more help?** See `ADMIN_USER_MANAGEMENT_GUIDE.md` for detailed documentation.

**Last Updated:** July 19, 2026
