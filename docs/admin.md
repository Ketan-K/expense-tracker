# Admin Access Configuration

## Overview

The admin dashboard (`/admin`) provides database migration and maintenance tools. Access is restricted to authorized users only.

## Setup

### 1. Configure Admin Users

Add the `ADMIN_EMAILS` environment variable with a comma-separated list of admin email addresses:

**Local Development** (`.env.local`):

```env
ADMIN_EMAILS=admin@example.com,developer@company.com
```

**Production** (Vercel):

1. Go to your project Settings → Environment Variables
2. Add new variable:
   - Name: `ADMIN_EMAILS`
   - Value: `admin@example.com,other-admin@example.com`
3. Redeploy your application

### 2. Sign In and Access

1. Sign in with one of the admin email addresses
2. Navigate to `/admin`
3. You'll see the admin dashboard with migration tools

## Security Features

- ✅ **Secure by default**: If `ADMIN_EMAILS` is not configured, no one has admin access
- ✅ **Email verification**: Only emails listed in `ADMIN_EMAILS` can access admin routes
- ✅ **Automatic redirect**: Non-admin users are redirected to dashboard
- ✅ **API protection**: All admin API endpoints require admin authorization
- ✅ **Session-based**: Uses NextAuth for secure authentication

## Admin Features

Once authenticated as admin, you can:

1. **Create Database Indexes**
   - Optimize query performance
   - Safe to run multiple times

2. **Migrate Expense Types**
   - Add `type` field to legacy expenses
   - Preview with dry-run mode

3. **Migrate Contact Arrays**
   - Convert phone/email to array format
   - Support multiple contact methods

## Troubleshooting

**"Access Denied" or redirected to dashboard**

- Verify your email is in the `ADMIN_EMAILS` list
- Check for typos or extra spaces in environment variable
- Ensure you've redeployed after adding the variable
- Sign out and sign back in

**Can't access after adding email**

- Clear browser cache and cookies
- Verify environment variable is set correctly
- Check Vercel deployment logs for errors

**Multiple environments**

- Set `ADMIN_EMAILS` separately for preview and production
- Use different admin lists for different environments if needed

## Best Practices

1. **Limit admin users**: Only add necessary personnel
2. **Use work emails**: Easier to manage and revoke
3. **Review regularly**: Audit admin list periodically
4. **Test in preview**: Verify admin access in preview deployments first
5. **Monitor access**: Check logs for admin activity

## Example Configuration

**Single Admin**:

```env
ADMIN_EMAILS=admin@myapp.com
```

**Multiple Admins**:

```env
ADMIN_EMAILS=admin@myapp.com,developer@myapp.com,manager@myapp.com
```

**Multiple Environments**:

```env
# Development
ADMIN_EMAILS=dev@myapp.com,test@myapp.com

# Production
ADMIN_EMAILS=admin@myapp.com
```
