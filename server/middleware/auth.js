import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../db/index.js';
import { getSupabase, isSupabaseConfigured } from '../db/supabaseClient.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mangaalam_luxury_secret_key_change_in_production_2026';

/**
 * Sign a secure JWT for local business owner sessions
 */
export function signAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role || 'owner',
      token_version: admin.token_version || 1
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Authoritative Server-Side Authorization Middleware
 * Supports both Supabase Auth sessions and local cryptographically signed sessions.
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Access to boutique administration is strictly restricted to the business owner.'
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try Supabase Auth verification if configured
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      const { data: { user }, error: authErr } = await client.auth.getUser(token);

      if (user && !authErr) {
        // Verify owner/admin role in admin_profiles
        const { data: profile, error: profErr } = await client
          .from('admin_profiles')
          .select('id, email, name, role')
          .eq('id', user.id)
          .single();

        if (profile && ['owner', 'admin'].includes(profile.role)) {
          req.admin = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            auth_provider: 'supabase'
          };
          return next();
        }
      }
    } catch (sbErr) {
      // Continue to local verification fallback
    }
  }

  // 2. Local JWT & SQLite verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const activeAdmin = db.prepare(`
      SELECT id, username, email, name, role, token_version
      FROM admins
      WHERE id = ?
    `).get(decoded.id);

    if (!activeAdmin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Owner account not recognized or revoked.'
      });
    }

    if (decoded.token_version && activeAdmin.token_version && decoded.token_version !== activeAdmin.token_version) {
      return res.status(401).json({
        success: false,
        error: 'Your session has expired due to a recent password update. Please log in with your new password.'
      });
    }

    req.admin = {
      ...activeAdmin,
      auth_provider: 'sqlite'
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid security token. Please log in again.'
    });
  }
}
