import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { signAdminToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// In-memory rate limiting for brute-force login mitigation
const loginAttempts = new Map(); // ip/key -> { count: number, lockedUntil: number }

function checkRateLimit(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt) return { allowed: true };

  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `Too many failed login attempts. Desk temporarily locked. Please retry in ${remainingMinutes} minute(s).`
    };
  }

  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: now };
  attempt.count += 1;

  if (attempt.count >= 5) {
    attempt.lockedUntil = now + 15 * 60 * 1000; // 15-minute lockout
  }
  loginAttempts.set(key, attempt);
}

function clearFailedAttempts(key) {
  loginAttempts.delete(key);
}

import { getSupabase, isSupabaseConfigured } from '../db/supabaseClient.js';
import { repository } from '../db/repository.js';

/**
 * GET /api/auth/status
 * Check if the owner account has been initialized (does not leak credentials)
 */
router.get('/status', async (req, res) => {
  try {
    const hasOwner = await repository.hasOwner();
    const provider = await repository.getActiveProvider();
    res.json({
      success: true,
      hasOwner,
      provider
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database status check failed.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate business owner (Supabase Auth when configured, with local SQLite fallback)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const rateLimitKey = `${clientIp}_${email ? email.trim().toLowerCase() : ''}`;

    const rateCheck = checkRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateCheck.message
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both owner email and password.'
      });
    }

    // 1. Try Supabase Auth if configured
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase();
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (authData && authData.user && authData.session) {
          // Verify role in admin_profiles
          const { data: profile } = await client
            .from('admin_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profile && ['owner', 'admin'].includes(profile.role)) {
            clearFailedAttempts(rateLimitKey);
            return res.json({
              success: true,
              token: authData.session.access_token,
              auth_provider: 'supabase',
              admin: {
                id: profile.id,
                username: profile.email.split('@')[0],
                email: profile.email,
                name: profile.name,
                role: profile.role
              }
            });
          }
        }
      } catch (sbErr) {
        // Fall through to local verification
      }
    }

    // 2. Local SQLite Authentication
    const admin = db.prepare(`
      SELECT id, username, email, password_hash, name, role, token_version
      FROM admins
      WHERE lower(email) = lower(?) OR lower(username) = lower(?)
    `).get(email.trim(), email.trim());

    if (!admin) {
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({
        success: false,
        error: 'Invalid owner credentials.'
      });
    }

    const passwordMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!passwordMatch) {
      recordFailedAttempt(rateLimitKey);
      return res.status(401).json({
        success: false,
        error: 'Invalid owner credentials.'
      });
    }

    // Login successful — reset rate limiter
    clearFailedAttempts(rateLimitKey);

    // Update last login timestamp
    db.prepare("UPDATE admins SET last_login = datetime('now') WHERE id = ?").run(admin.id);

    const token = signAdminToken(admin);

    res.json({
      success: true,
      token,
      auth_provider: 'sqlite',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An internal error occurred during authentication.'
    });
  }
});

/**
 * GET /api/auth/me
 * Verify current owner session
 */
router.get('/me', requireAdmin, (req, res) => {
  try {
    const admin = db.prepare(`
      SELECT id, username, email, name, role, last_login, password_changed_at
      FROM admins
      WHERE id = ?
    `).get(req.admin.id);

    if (!admin) {
      return res.status(404).json({ success: false, error: 'Owner account not found.' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify session.' });
  }
});

/**
 * POST /api/auth/change-password
 * Authenticated owner changes their password
 */
router.post('/change-password', requireAdmin, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both current and new password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long.'
      });
    }

    // Verify current password
    const admin = db.prepare('SELECT password_hash, token_version FROM admins WHERE id = ?').get(req.admin.id);
    if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.'
      });
    }

    // Hash new password with 12 salt rounds
    const salt = bcrypt.genSaltSync(12);
    const newHash = bcrypt.hashSync(newPassword, salt);
    const nextTokenVersion = (admin.token_version || 1) + 1;

    db.prepare(`
      UPDATE admins
      SET password_hash = ?, token_version = ?, password_changed_at = datetime('now')
      WHERE id = ?
    `).run(newHash, nextTokenVersion, req.admin.id);

    // Issue updated token with new version
    const updatedAdmin = db.prepare('SELECT id, username, email, name, role, token_version FROM admins WHERE id = ?').get(req.admin.id);
    const freshToken = signAdminToken(updatedAdmin);

    console.log(`[Security Audit] Password successfully changed for owner ID ${req.admin.id} (${req.admin.email}). Prior sessions invalidated.`);

    res.json({
      success: true,
      message: 'Password updated successfully. All other active sessions have been securely invalidated.',
      token: freshToken
    });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request a cryptographically secure password reset token
 */
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your owner email.' });
    }

    const admin = db.prepare('SELECT id, email, name FROM admins WHERE lower(email) = lower(?)').get(email.trim());

    if (admin) {
      // Generate 32-byte secure random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Expire in 1 hour
      db.prepare(`
        INSERT INTO admin_password_resets (admin_id, token_hash, expires_at)
        VALUES (?, ?, datetime('now', '+1 hour'))
      `).run(admin.id, tokenHash);

      // Log token securely to server terminal for owner console recovery
      console.log('======================================================================');
      console.log('[SECURITY RESET AUTHORIZATION]');
      console.log(`Owner Account: ${admin.email}`);
      console.log(`One-Time Reset Token (valid for 1 hour):`);
      console.log(`  ${rawToken}`);
      console.log('You can also reset directly via terminal: npm run admin:reset');
      console.log('======================================================================');
    }

    // Generic response to avoid email discovery
    res.json({
      success: true,
      message: 'If an owner account with this email exists, a password reset authorization has been recorded. Check the server console or use the CLI management tool.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to process password reset request.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Complete password reset using token
 */
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both the reset token and your new password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long.'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const resetRecord = db.prepare(`
      SELECT r.id as reset_id, r.admin_id, a.token_version, a.email
      FROM admin_password_resets r
      JOIN admins a ON a.id = r.admin_id
      WHERE r.token_hash = ?
        AND r.used_at IS NULL
        AND r.expires_at > datetime('now')
    `).get(tokenHash);

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset token. Please request a new one.'
      });
    }

    // Hash new password
    const salt = bcrypt.genSaltSync(12);
    const newHash = bcrypt.hashSync(newPassword, salt);
    const nextTokenVersion = (resetRecord.token_version || 1) + 1;

    db.transaction(() => {
      // Update password and invalidate previous tokens
      db.prepare(`
        UPDATE admins
        SET password_hash = ?, token_version = ?, password_changed_at = datetime('now')
        WHERE id = ?
      `).run(newHash, nextTokenVersion, resetRecord.admin_id);

      // Mark reset token as used
      db.prepare("UPDATE admin_password_resets SET used_at = datetime('now') WHERE id = ?").run(resetRecord.reset_id);
    })();

    console.log(`[Security Audit] Password successfully reset for owner ${resetRecord.email} via reset token.`);

    res.json({
      success: true,
      message: 'Your owner password has been reset successfully. Please log in with your new credentials.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
});

export default router;
