# GoOut - University of Michigan Social Events Platform

GoOut is a comprehensive social event planning platform designed exclusively for University of Michigan students. The platform enables students to create profiles, discover spontaneous events, and connect with peers through a request-and-approval system.

## 🌟 Features

### Core Functionality
- **User Authentication**: Google OAuth with @umich.edu email domain restriction
- **Profile Management**: Complete user profiles with photos, department info, and social connections
- **Event Discovery**: Browse events created within the last 12 hours
- **Event Creation**: Create spontaneous events with time restrictions (12-hour limit, no creation between 12AM-5AM)
- **Social Interactions**: Request-to-join system with host approval
- **Real-time Notifications**: Instant updates for event requests and approvals
- **People Directory**: Discover and connect with other U-M students

### Technical Features
- **Real-time Data Sync**: Firestore real-time listeners for instant updates
- **Offline Support**: Queue actions when offline, sync when back online
- **Image Management**: Upload and manage profile pictures, cover photos, and event posters
- **Performance Optimization**: Caching, lazy loading, and bundle optimization
- **Error Handling**: Comprehensive error boundaries and retry mechanisms
- **Analytics**: Built-in performance monitoring and user analytics
- **Testing**: Comprehensive test suite with unit, integration, and E2E tests

## 🚀 Tech Stack

- **Frontend**: Next.js 15.5.3 with App Router, React 19.1.0
- **UI Components**: shadcn/ui with Tailwind CSS 4
- **Database**: Firebase Firestore for real-time data
- **Authentication**: Firebase Auth with Google OAuth
- **Storage**: Firebase Storage for images
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context + Custom Hooks
- **Testing**: Jest + React Testing Library
- **Performance**: Built-in caching and optimization

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore, Auth, and Storage enabled
- Google OAuth credentials configured for @umich.edu domain

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goout
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Configure Firebase**
   - Enable Google Authentication in Firebase Console
   - Set up Firestore database
   - Configure Storage bucket
   - Deploy Firestore security rules (see `firestore.rules`)

5. **Initialize shadcn/ui** (if not already done)
   ```bash
   npx shadcn@latest init
   ```

## 🏃‍♂️ Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.js          # Root layout with providers
│   ├── page.js            # Landing page
│   ├── plans/             # Events feed page
│   ├── people/            # User directory page
│   └── profile/           # User profile page
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── Layout.jsx         # Main app layout
│   ├── Sidebar.jsx        # Navigation sidebar
│   ├── EventFeed.jsx      # Events discovery
│   ├── EventCard.jsx      # Event display component
│   ├── ProfileForm.jsx    # Profile creation/editing
│   └── ...               # Other components
├── contexts/              # React Context providers
│   └── AuthContext.js     # Authentication context
├── hooks/                 # Custom React hooks
│   ├── useProfile.js      # Profile management
│   ├── useEvents.js       # Event management
│   └── useNotifications.js # Notifications
├── lib/                   # Utility libraries
│   ├── firebase.js        # Firebase configuration
│   ├── firestore.js       # Firestore service layer
│   ├── validation.js      # Form validation
│   ├── utils.js           # Utility functions
│   ├── cache.js           # Caching system
│   ├── performance.js     # Performance monitoring
│   └── analytics.js       # Analytics tracking
├── types/                 # TypeScript type definitions
└── __tests__/             # Test files
    ├── components/        # Component tests
    ├── integration/       # Integration tests
    └── utils/             # Test utilities
```

## 🔒 Security

### Firestore Security Rules
The application uses comprehensive Firestore security rules to ensure:
- Only @umich.edu users can access the platform
- Users can only modify their own profiles
- Event hosts can manage their events
- Proper data validation and access control

### Authentication
- Google OAuth with domain restriction
- Automatic logout for non-@umich.edu users
- Session management and token refresh

## 📱 Features Deep Dive

### Event System
- **Time Restrictions**: Events can only be created for the next 12 hours
- **Quiet Hours**: No event creation between 12AM-5AM
- **Request System**: Users request to join, hosts approve/deny
- **Real-time Updates**: Instant notifications for all interactions

### Profile System
- **Complete Profiles**: Name, department, username, photos
- **Username Validation**: Real-time availability checking
- **Social Connections**: Track people you've met
- **Event History**: View attended events and photos

### Notification System
- **Real-time Delivery**: Firestore listeners + WebSocket fallback
- **Offline Queue**: Store notifications when offline
- **Smart Routing**: Navigate to relevant content from notifications

## 🧪 Testing

The project includes comprehensive testing:

### Unit Tests
```bash
npm test -- --testPathPattern=components
```

### Integration Tests
```bash
npm test -- --testPathPattern=integration
```

### Coverage Report
```bash
npm run test:coverage
```

### Test Structure
- Component tests with React Testing Library
- Integration tests for user flows
- Mock Firebase services for testing
- Comprehensive error scenario testing

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
Ensure all environment variables are configured in your deployment platform.

### Performance Optimization
The application includes:
- Automatic code splitting
- Image optimization
- Caching strategies
- Bundle analysis
- Performance monitoring

## 📊 Monitoring & Analytics

### Built-in Analytics
- Page view tracking
- User interaction analytics
- Performance metrics (Core Web Vitals)
- Error tracking and reporting

### Performance Monitoring
- Real-time performance metrics
- Memory usage monitoring
- Bundle size analysis
- Cache hit rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in the `/docs` folder
- Review the test files for usage examples
- Open an issue for bugs or feature requests

## 🔮 Future Enhancements

- Push notifications for mobile devices
- Advanced event filtering and search
- Event categories and tags
- Photo sharing and galleries
- Integration with campus calendar systems
- Mobile app development
- Advanced analytics dashboard

---

Built with ❤️ for the University of Michigan community