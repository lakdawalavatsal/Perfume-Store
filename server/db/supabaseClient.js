import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

let supabaseInstance = null;
let lastConnectionCheck = null;

/**
 * Check if valid Supabase configuration is present in environment
 */
export function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return false;
  if (url.includes('your-project') || key.includes('your-service-role-key')) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Get or initialize the authoritative Supabase client (Service Role)
 * Always kept strictly on the server; never exposed to browser
 */
export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  if (!isSupabaseConfigured()) {
    return null;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  supabaseInstance = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: ws
    }
  });

  return supabaseInstance;
}

/**
 * Safe key format inspector that never reveals secret characters
 */
function inspectKeyFormat(key) {
  if (!key) return { present: false, format: 'missing', length: 0 };
  if (typeof key !== 'string') return { present: true, format: 'invalid_type', length: 0 };
  const trimmed = key.trim();
  let format = 'unknown';
  if (trimmed.startsWith('sb_secret_')) format = 'sb_secret';
  else if (trimmed.startsWith('sb_publishable_')) format = 'sb_publishable';
  else if (trimmed.startsWith('ey')) format = 'legacy_jwt';
  return {
    present: true,
    format,
    length: trimmed.length
  };
}

/**
 * Test live connection to Supabase PostgreSQL database
 */
export async function testSupabaseConnection() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  const keyDiagnostics = {
    urlPresent: Boolean(url && (url.startsWith('http://') || url.startsWith('https://'))),
    serviceRoleKey: inspectKeyFormat(serviceRoleKey),
    anonKey: inspectKeyFormat(anonKey)
  };

  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      status: 'pending_configuration',
      message: 'Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not yet configured in .env',
      diagnostics: keyDiagnostics
    };
  }

  const client = getSupabase();
  const startTime = Date.now();

  try {
    // Perform a lightweight probe to products table
    const { count, error, status, statusText } = await client
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error || (status && status >= 400)) {
      // Capture gateway diagnostic details directly from endpoint
      let gatewayDetails = null;
      try {
        const probeRes = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
          method: 'GET',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        });
        const probeText = await probeRes.text();
        try {
          gatewayDetails = JSON.parse(probeText);
        } catch {
          gatewayDetails = { raw: probeText };
        }
      } catch (probeErr) {
        gatewayDetails = { probeError: probeErr.message };
      }

      // Probe with anon key to verify whether project and tables are reachable
      let anonProbe = null;
      if (anonKey) {
        try {
          const anonClient = createClient(url, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            realtime: { transport: ws }
          });
          const anonRes = await anonClient.from('products').select('*', { count: 'exact', head: true });
          anonProbe = {
            status: anonRes.status,
            statusText: anonRes.statusText,
            success: !anonRes.error && anonRes.status < 400,
            productCount: anonRes.count
          };
        } catch (anonErr) {
          anonProbe = { success: false, error: anonErr.message };
        }
      }

      const responseMessage = (gatewayDetails && gatewayDetails.message) || error?.message || statusText || 'Query failed';
      const responseHint = (gatewayDetails && gatewayDetails.hint) || error?.hint || null;

      return {
        connected: false,
        status: 'query_failed',
        httpStatus: status || 401,
        statusText: statusText || 'Unauthorized',
        responseMessage,
        hint: responseHint,
        diagnostics: keyDiagnostics,
        anonProbe,
        message: `Connected to Supabase endpoint, but query failed (HTTP ${status || 401}: ${responseMessage}).`
      };
    }

    const latency = Date.now() - startTime;
    lastConnectionCheck = {
      connected: true,
      status: 'active',
      httpStatus: status || 200,
      latencyMs: latency,
      productCount: count,
      diagnostics: keyDiagnostics,
      timestamp: new Date().toISOString()
    };

    return lastConnectionCheck;
  } catch (err) {
    return {
      connected: false,
      status: 'network_failure',
      error: err.message,
      message: `Failed to reach Supabase: ${err.message}`,
      diagnostics: keyDiagnostics
    };
  }
}

/**
 * Export initialized client or null
 */
export const supabase = getSupabase();
