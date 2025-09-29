## Cucumbers

A modern, production-ready authentication starter built with a monorepo architecture. This starter provides a complete user authentication system using email magic links, perfect for rapid application development. This starter comes with user registration, sign-in, and session management fully implemented using secure, passwordless authentication through email magic links.

### ✨ Features

- **Passwordless Authentication**: Secure email magic link authentication
- **User Registration & Sign-in**: Complete auth flow with form validation
- **Session Management**: Secure session handling with automatic token refresh
- **Type-Safe API**: End-to-end TypeScript with shared types
- **Modern UI**: Beautiful, responsive components with Shadcn/UI
- **Database Ready**: PostgreSQL schema with user and session tables

### 🛠 Technology Stack

**Frontend**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[Shadcn/UI](https://ui.shadcn.com/)** - Modern, accessible UI components
- **[TanStack Query](https://tanstack.com/query)** - Powerful data fetching and state management
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

**Backend**
- **[Express.js](https://expressjs.com/)** - Minimal Node.js web framework
- **[Stytch](https://stytch.com/)** - Authentication platform for magic links
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe server development

**Database**
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database toolkit
- **[Supabase](https://supabase.com/)** - PostgreSQL database hosting
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database

**Tools**
- **[Turborepo](https://turborepo.com/)** - High-performance monorepo build system
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

### 🔐 Authentication

The authentication system uses a secure, passwordless flow:

**Sign-up Flow**
1. User enters name and email on `/sign-up`
2. System checks if user already exists
3. If new user, creates account in database
4. Sends magic link via Stytch to user's email
5. User clicks magic link in email
6. Magic link redirects to `/verify-magic-link` with token
7. System verifies token with Stytch
8. Creates session and redirects to dashboard

**Sign-in Flow**
1. User enters email on `/sign-in`
2. System verifies user exists in database
3. Sends magic link via Stytch to user's email
4. User clicks magic link in email
5. Magic link redirects to `/verify-magic-link` with token
6. System verifies token with Stytch
7. Creates session and redirects to dashboard

### 📁 Structure

```
cucumbers/
├── apps/
│   ├── next-js-app/          # Frontend Next.js application
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utility functions
│   └── express-js-api/       # Backend Express.js API
│       ├── src/
│       │   ├── controllers/  # Route handlers
│       │   └── routes/       # API route definitions
│       └── server.ts         # Express server setup
├── packages/
│   ├── database/             # Shared database schema & client
│   │   ├── src/
│   │   │   └── schema.ts     # Drizzle database schema
│   │   └── drizzle.config.ts # Database configuration
│   ├── eslint-config/        # Shared ESLint configurations
│   └── typescript-config/    # Shared TypeScript configurations
└── package.json              # Workspace configuration
```

## 📝 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/sign-in` | POST | Sign in existing user and send magic link |
| `/api/users/sign-out` | POST | Sign out and invalidate session |
| `/api/users/sign-up` | POST | Register new user and send magic link |
| `/api/users/verify-magic-link` | POST | Verify magic link token and create session |
| `/api/users/me` | GET | Get current user info (requires auth) |

## 🔗 Resources

- [Turborepo Documentation](https://turborepo.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [Stytch Documentation](https://stytch.com/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
