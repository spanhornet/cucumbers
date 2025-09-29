// Express
import { Request, Response } from 'express';

// Drizzle ORM
import { eq } from 'drizzle-orm';

// Schema
import { db, schema } from '@repo/database';

// Stytch
import * as stytch from 'stytch';

// Initialize Stytch client
const stytchClient = new stytch.Client({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET_TOKEN!,
});


export class UsersController {
  static async signUp(req: Request, res: Response) {
    try {
      const { name, email } = req.body;

      // Validate required fields
      if (!email || !name) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Please provide both name and email address'
        });
      }

      // Validate email format (basic validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      // Validate name (basic validation)
      if (name.trim().length < 2) {
        return res.status(400).json({
          error: 'Invalid name',
          message: 'Name must be at least 2 characters long'
        });
      }

      // Check if user already exists in database
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
      }

      // Create new user in database
      const newUser = await db
        .insert(schema.users)
        .values({
          id: crypto.randomUUID(),
          name: name.trim(),
          email: email.toLowerCase(),
        })
        .returning();

      // Verify user was created
      if (!newUser || newUser.length === 0) {
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to create user account'
        });
      }

      const createdUser = newUser[0]!;

      // Send magic link using Stytch
      const magicLinkParams = {
        email: email,
        login_magic_link_url: `${process.env.FRONTEND_URL}/verify-magic-link`,
        signup_magic_link_url: `${process.env.FRONTEND_URL}/verify-magic-link`,
      };

      const stytchResponse = await stytchClient.magicLinks.email.loginOrCreate(magicLinkParams);

      return res.status(201).json({
        success: true,
        message: 'Magic link sent to your email',
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
        },
        stytch: {
          user_id: stytchResponse.user_id,
          request_id: stytchResponse.request_id
        }
      });

    } catch (error) {
      console.error('Sign up error:', error);

      // Handle Stytch-specific errors
      if (error instanceof Error && 'error_type' in error) {
        return res.status(400).json({
          error: 'Authentication service error',
          message: error.message || 'Failed to send magic link'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating your account'
      });
    }
  }

  static async signIn(req: Request, res: Response) {
    try {
      const { email } = req.body;

      // Validate email is provided
      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
          message: 'Please provide an email address'
        });
      }

      // Validate email format (basic validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          message: 'Please provide a valid email address'
        });
      }

      // Check if user exists in database
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'No account found with this email address'
        });
      }

      // Send magic link using Stytch
      const magicLinkParams = {
        email: email,
        login_magic_link_url: `${process.env.FRONTEND_URL}/verify-magic-link`,
        signup_magic_link_url: `${process.env.FRONTEND_URL}/verify-magic-link`,
      };

      const stytchResponse = await stytchClient.magicLinks.email.loginOrCreate(magicLinkParams);

      return res.status(200).json({
        success: true,
        message: 'Magic link sent successfully',
        user_id: stytchResponse.user_id,
        request_id: stytchResponse.request_id
      });

    } catch (error) {
      console.error('Sign in error:', error);

      // Handle Stytch-specific errors
      if (error instanceof Error && 'error_type' in error) {
        return res.status(400).json({
          error: 'Authentication service error',
          message: error.message || 'Failed to send magic link'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  }

  static async verifyMagicLink(req: Request, res: Response) {
    try {
      const { token } = req.body;

      // Validate token (basic validation)
      if (!token) {
        return res.status(400).json({
          error: 'Token is required',
          message: 'Magic link token is missing'
        });
      }

      // Verify magic link
      const verificationResponse = await stytchClient.magicLinks.authenticate({
        token: token
      });

      // Get user info from Stytch response
      const stytchUser = verificationResponse.user;
      const stytchUserId = stytchUser.user_id;
      const userEmail = stytchUser.emails[0]?.email;

      if (!userEmail) {
        return res.status(400).json({
          error: 'Invalid user data',
          message: 'Unable to retrieve user email from verification'
        });
      }

      // Find the user in our database
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, userEmail))
        .limit(1);

      if (existingUser.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account not found in database'
        });
      }

      const user = existingUser[0]!;

      // Create a new session
      const sessionId = crypto.randomUUID();
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Insert session into database
      const newSession = await db
        .insert(schema.sessions)
        .values({
          id: sessionId,
          userId: user.id,
          token: sessionToken,
          expiresAt: expiresAt,
          ipAddress: req.ip || req.connection.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null
        })
        .returning();

      if (!newSession || newSession.length === 0) {
        return res.status(500).json({
          error: 'Session creation failed',
          message: 'Failed to create user session'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Magic link verified successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        session: {
          token: sessionToken,
          expiresAt: expiresAt.toISOString()
        },
        stytch: {
          user_id: stytchUserId,
          session_token: verificationResponse.session_token,
          session_jwt: verificationResponse.session_jwt
        }
      });

    } catch (error) {
      console.error('Verify magic link error:', error);

      // Handle Stytch-specific errors
      if (error instanceof Error && 'error_type' in error) {
        return res.status(400).json({
          error: 'Invalid magic link',
          message: 'The magic link is invalid or has expired'
        });
      }

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during verification'
      });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      // Get session token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
      }

      const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!sessionToken) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Session token is required'
        });
      }

      // Find session in database and check if it's valid
      const sessionResult = await db
        .select({
          session: schema.sessions,
          user: schema.users
        })
        .from(schema.sessions)
        .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
        .where(eq(schema.sessions.token, sessionToken))
        .limit(1);

      if (sessionResult.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid session token'
        });
      }

      const { session, user } = sessionResult[0]!;

      // Check if session has expired
      if (new Date() > new Date(session.expiresAt)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Session has expired'
        });
      }

      // Return user and session information
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while retrieving user information'
      });
    }
  }
}