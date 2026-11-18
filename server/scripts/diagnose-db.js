#!/usr/bin/env node

import dotenv from 'dotenv';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

function getKeyFormat(key) {
  if (!key) return 'MISSING';
  if (typeof key !== 'string') return `INVALID_TYPE_${typeof key}`;
  if (key.startsWith('sb_secret_')) return `sb_secret (prefix: sb_secret_, length: ${key.length})`;
  if (key.startsWith('sb_publishable_')) return `sb_publishable (prefix: sb_publishable_, length: ${key.length})`;
  if (key.startsWith('ey')) return `legacy_jwt (prefix: ey..., length: ${key.length})`;
  return `unknown_prefix_${key.substring(0, 3)}... (length: ${key.length})`;
}

async function diagnose() {
  console.log('\n======================================================================');
  console.log('🔍 MANGAALAM — Supabase Diagnostic Probe');
  console.log('======================================================================\n');

  console.log('1. Environment Variables Presence & Key Formats:');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? 'PRESENT (valid URL)' : 'MISSING');
  console.log('   SUPABASE_ANON_KEY:', getKeyFormat(process.env.SUPABASE_ANON_KEY));
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', getKeyFormat(process.env.SUPABASE_SERVICE_ROLE_KEY));

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !serviceKey) {
    console.log('\n❌ Required variables missing from .env');
    return;
  }

  console.log('\n2. Testing SDK Query via @supabase/supabase-js (Service Role Key):');
  const client1 = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws }
  });

  const res1 = await client1.from('products').select('*', { count: 'exact', head: true });
  console.log('   HTTP Status:', res1.status, res1.statusText || '');
  console.log('   Record Count:', res1.count);
  console.log('   Error Details:', res1.error ? JSON.stringify({
    message: res1.error.message,
    details: res1.error.details,
    hint: res1.error.hint,
    code: res1.error.code
  }, null, 2) : 'None (Query Succeeded)');

  console.log('\n3. Testing Header Combinations for Service Key:');
  const headerVariants = [
    { name: 'apikey + Bearer Authorization', headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } },
    { name: 'apikey only (no Authorization)', headers: { 'apikey': serviceKey } },
    { name: 'apikey + direct Authorization (no Bearer)', headers: { 'apikey': serviceKey, 'Authorization': serviceKey } },
    { name: 'anon apikey + Bearer serviceKey', headers: { 'apikey': anonKey, 'Authorization': `Bearer ${serviceKey}` } },
    { name: 'serviceKey apikey + Bearer anonKey', headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${anonKey}` } },
    { name: 'apikey + Bearer + Node User-Agent', headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'User-Agent': 'MangaalamBackend/1.0.0 (Node.js)' } }
  ];

  for (const variant of headerVariants) {
    try {
      const rawRes = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
        method: 'GET',
        headers: variant.headers
      });
      const body = await rawRes.text();
      console.log(`   [${variant.name}] -> HTTP ${rawRes.status}: ${body.slice(0, 100)}`);
    } catch (e) {
      console.log(`   [${variant.name}] -> Fetch Error: ${e.message}`);
    }
  }

  if (anonKey) {
    console.log('\n4. Testing SDK Query via @supabase/supabase-js (Anon Key):');
    const client2 = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const res2 = await client2.from('products').select('*', { count: 'exact', head: true });
    console.log('   HTTP Status:', res2.status, res2.statusText || '');
    console.log('   Record Count:', res2.count);
    console.log('   Error Details:', res2.error ? JSON.stringify({
      message: res2.error.message,
      details: res2.error.details,
      hint: res2.error.hint,
      code: res2.error.code
    }, null, 2) : 'None (Query Succeeded)');

    console.log('\n5. Testing Raw Direct HTTP Fetch to PostgREST /rest/v1/products (Anon Key):');
    try {
      const rawRes2 = await fetch(`${url}/rest/v1/products?select=*`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      console.log('   HTTP Status:', rawRes2.status, rawRes2.statusText);
      const body2 = await rawRes2.text();
      console.log('   Response Body:', body2);
    } catch (e) {
      console.log('   Fetch Error:', e.message);
    }
  }

  console.log('\n======================================================================\n');
}

diagnose().catch(err => {
  console.error('Fatal diagnostic error:', err.message);
});
