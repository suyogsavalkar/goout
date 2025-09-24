# Product Overview

**GoOut** is a Next.js web application with Firebase Google authentication that restricts access to users with University of Michigan (@umich.edu) email addresses.

## Key Features
- Google OAuth authentication via Firebase
- Email domain restriction (umich.edu only)
- User profile display with photo and name
- Waitlist messaging for non-umich users
- Responsive design with Tailwind CSS

## Target Users
- University of Michigan students, faculty, and staff
- Users must have valid @umich.edu email addresses to access the application

## Authentication Flow
- Users sign in with Google OAuth
- Email domain validation occurs automatically
- Non-umich users are signed out immediately and shown waitlist message
- Authenticated users see their profile and can sign out