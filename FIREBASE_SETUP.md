# Firebase Google Authentication Setup Guide

## 1. Install Dependencies

First, install the Firebase SDK:

```bash
npm install firebase
```

## 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "goout-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 3. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Google** provider
5. Toggle **Enable**
6. Add your project's domain to **Authorized domains** (for production)
7. Click **Save**

## 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon in sidebar)
2. Scroll down to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 5. Set Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 6. Configure Google OAuth (Production)

For production deployment:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 client ID
5. Add your production domain to **Authorized JavaScript origins**
6. Add your production domain + `/auth` to **Authorized redirect URIs**

## 7. Test the Setup

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)
3. Click the "Sign in with Google" button
4. Complete the Google sign-in flow
5. You should see your profile information displayed

## Features Included

- ✅ Google Sign-in with popup
- ✅ User authentication state management
- ✅ Sign out functionality
- ✅ Loading states
- ✅ User profile display (name, photo)
- ✅ Responsive design
- ✅ Error handling

## File Structure

```
src/
├── lib/
│   └── firebase.js          # Firebase configuration
├── contexts/
│   └── AuthContext.js       # Authentication context provider
├── components/
│   └── AuthButton.js        # Sign in/out button component
├── hooks/
│   └── useAuth.js          # Authentication hook (alternative)
└── app/
    ├── layout.js           # Root layout with AuthProvider
    └── page.js             # Home page with AuthButton
```

## Security Notes

- Never commit your `.env.local` file to version control
- The Firebase config with API keys is safe to expose in client-side code
- For production, configure proper authorized domains in Firebase Console
- Consider implementing additional security rules for Firestore if you plan to use it

## Next Steps

- Add protected routes
- Implement user profiles
- Add Firestore database integration
- Set up Firebase security rules
- Add email/password authentication
- Implement password reset functionality