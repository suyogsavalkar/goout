# Technology Stack

## Framework & Runtime
- **Next.js 15.5.3** with App Router
- **React 19.1.0** with React DOM
- **Node.js** runtime

## Styling & UI
- **Tailwind CSS 4** for styling
- **Geist fonts** (Sans and Mono) from Google Fonts
- Responsive design patterns

## Authentication & Backend
- **Firebase 12.3.0** for authentication
- Google OAuth provider
- Client-side authentication state management

## Development Tools
- **ESLint 9** with Next.js config
- **Turbopack** for faster builds and development

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
```

### Building
```bash
npm run build        # Build for production with Turbopack
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

## Environment Configuration
- Uses `.env.local` for Firebase configuration
- All Firebase config variables prefixed with `NEXT_PUBLIC_`
- Environment variables are exposed to client-side code

## Build System Notes
- Uses Turbopack for both development and production builds
- PostCSS configuration for Tailwind CSS processing
- ESLint configuration extends Next.js recommended settings