# Overview

Linkup is a modern social media platform built for developers, creators, and innovators. The application provides a Twitter-like experience where users can create posts, interact through likes and comments, follow other users, and discover trending topics. The platform is designed with a clean, professional interface using shadcn/ui components and focuses on building meaningful connections within developer communities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built using React with TypeScript and follows a modern component-based architecture. Key design decisions include:

- **UI Framework**: Uses shadcn/ui components built on top of Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS for utility-first styling with custom CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a feature-based structure with reusable components, custom hooks, and proper separation of concerns between UI logic and business logic.

## Backend Architecture
The server uses Express.js with TypeScript in a RESTful API design:

- **Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **Authentication**: Replit OAuth integration with session-based authentication using Passport.js
- **Database Layer**: Repository pattern implementation with a storage abstraction layer
- **API Design**: RESTful endpoints for user management, posts, comments, likes, and follows
- **Development Setup**: Hot reloading with custom Vite integration for seamless development

The backend implements proper error handling, request logging, and maintains clean separation between routes, business logic, and data access.

## Data Storage Architecture
The application uses PostgreSQL as the primary database with Drizzle ORM:

- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Zod validation schemas for type safety
- **Schema Design**: Normalized database structure with proper foreign key relationships
- **Session Storage**: Database-backed sessions using connect-pg-simple
- **Migrations**: Drizzle Kit for database schema management

The database schema includes tables for users, posts, comments, likes, follows, and sessions with appropriate indexes and constraints.

## Authentication Architecture
Uses Replit's OAuth provider for secure authentication:

- **Provider**: Replit OAuth with OpenID Connect
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Security**: HTTPS-only cookies, session TTL, and proper CSRF protection
- **User Management**: Automatic user creation/updates based on OAuth claims

## Project Structure
The application follows a monorepo structure with clear separation:

- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript types and database schemas
- Path aliases configured for clean imports (@/ for client, @shared for shared)

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe SQL toolkit and query builder
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication Services
- **Replit OAuth**: Primary authentication provider using OpenID Connect
- **Passport.js**: Authentication middleware for Express

## UI and Styling
- **shadcn/ui**: Pre-built accessible UI components
- **Radix UI**: Headless UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire stack
- **React Query**: Server state management and caching
- **Wouter**: Lightweight React router

## Hosting and Deployment
- **Replit**: Primary hosting platform with integrated development environment
- **Replit Database**: Configured for PostgreSQL hosting
- **WebSocket**: For real-time features using the ws library for Neon connections