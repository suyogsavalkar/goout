# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.js          # Root layout with AuthProvider
│   ├── page.js            # Home page
│   ├── globals.css        # Global styles
│   └── favicon.ico        # App icon
├── components/            # Reusable React components
│   └── AuthButton.js      # Authentication button component
├── contexts/              # React Context providers
│   └── AuthContext.js     # Authentication context and provider
├── hooks/                 # Custom React hooks
│   └── useAuth.js         # Authentication hook (alternative to context)
└── lib/                   # Utility libraries and configurations
    └── firebase.js        # Firebase configuration and exports

public/                    # Static assets
├── *.svg                  # SVG icons and graphics

.kiro/                     # Kiro IDE configuration
└── steering/              # AI assistant guidance documents
```

## Architectural Patterns

### Authentication Architecture
- **Context Pattern**: `AuthContext` provides authentication state globally
- **Provider Pattern**: `AuthProvider` wraps the app in root layout
- **Hook Pattern**: `useAuth()` hook for consuming auth context
- **Client Components**: All auth-related components use `"use client"` directive

### Component Organization
- **Page Components**: Located in `src/app/` following App Router conventions
- **Reusable Components**: Stored in `src/components/` with descriptive names
- **Context Providers**: Centralized in `src/contexts/` directory
- **Utility Functions**: Firebase config and helpers in `src/lib/`

### Import Conventions
- Use `@/` alias for imports from `src/` directory
- Absolute imports preferred over relative imports
- Firebase functions imported from `src/lib/firebase.js`

### File Naming
- React components use PascalCase (e.g., `AuthButton.js`)
- Context files use PascalCase with "Context" suffix
- Hook files use camelCase with "use" prefix
- Configuration files use lowercase with extensions

### Code Organization Principles
- Separation of concerns: UI, state management, and configuration are separate
- Single responsibility: Each component/context has one clear purpose
- Client-side rendering: Authentication components marked with `"use client"`
- Environment-based configuration: Firebase config uses environment variables