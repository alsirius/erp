# Email Configuration Setup Guide

## Overview
Siriux uses a dual email service configuration similar to ticket-mix, with primary and backup email services. The system automatically falls back to the backup service if the primary fails.

## Development Mode (Local Development)

### Default Behavior: Console Logging
By default, in development mode, emails are **printed to the console** instead of being sent:

```bash
🔔 DEVELOPMENT MODE: Email Verification
=====================================
To: user@example.com
Subject: Email Verification Code
Verification Code: 123456
=====================================
```

### Enable Real Emails in Development
Set `ALWAYS_SEND_EMAILS=true` in `.env.development` to send real emails even in development:

```bash
# backend/.env.development
ALWAYS_SEND_EMAILS=true
```

## Production Mode

In production, emails are **always sent** (the `ALWAYS_SEND_EMAILS` setting is ignored).

## Email Service Configuration

### Primary Email Service (Gmail)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME="Siriux"
```

### Backup Email Service (IONOS)
```bash
BACKUP_EMAIL_HOST=smtp.ionos.co.uk
BACKUP_EMAIL_PORT=587
BACKUP_EMAIL_SECURE=false
BACKUP_EMAIL_USER=info@yourdomain.co.uk
BACKUP_EMAIL_PASSWORD=your-backup-password
BACKUP_EMAIL_FROM_NAME="Siriux by YourDomain"
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication
1. Go to [Google Account settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → Enable

### 2. Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" for the app
3. Select "Other (Custom name)" → Enter "Siriux"
4. Copy the generated 16-character password

### 3. Update Environment Variables
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=the-16-character-app-password
```

## IONOS Email Setup Instructions

### 1. Log into IONOS Control Panel
2. Go to Email → Email Accounts
3. Create or select your email account
4. Find SMTP settings:
   - Host: smtp.ionos.co.uk
   - Port: 587 (STARTTLS)
   - Username: info@yourdomain.co.uk
   - Password: Your email password

## Testing Email Configuration

### Development Test
1. Register a new user
2. Check the console for the verification code output
3. Use the code to verify the email

### Production Test
1. Set `ALWAYS_SEND_EMAILS=true` in development
2. Register a new user
3. Check your email inbox for the verification code
4. Verify the email works correctly

## Email Templates

The system includes HTML email templates for:
- **Email Verification**: Clean, branded verification emails
- **Password Reset**: Secure password reset emails

Templates are automatically styled and include:
- Your company branding
- Responsive design
- Clear call-to-action buttons
- Professional footer

## Troubleshooting

### Gmail Authentication Issues
- **Error**: "Invalid login" or "Bad credentials"
- **Solution**: Use App Password, not your regular password

### IONOS Connection Issues
- **Error**: Connection timeout
- **Solution**: Check port 587 is open, use STARTTLS

### Development Emails Not Showing
- **Issue**: No console output
- **Solution**: Ensure `NODE_ENV=development` and `ALWAYS_SEND_EMAILS=false`

### Production Emails Not Sending
- **Issue**: Emails fail in production
- **Solution**: Check email credentials, ensure SMTP settings are correct

## Security Notes

- **Never commit actual email passwords** to version control
- **Use App Passwords** for Gmail, not regular passwords
- **Monitor email delivery** for bounce rates and spam issues
- **Consider SPF/DKIM records** for better deliverability

## Support Email Configuration

The frontend support button uses:
```bash
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.co.uk
```

Update this to your actual support email address for user support requests.
