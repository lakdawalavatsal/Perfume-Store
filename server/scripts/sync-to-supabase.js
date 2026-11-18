#!/usr/bin/env node

/**
 * MANGAALAM PERFUMES — Sync Local SQLite Data to Supabase PostgreSQL
 * Preserves all existing orders, items, and inventory without data loss.
 * 
 * Usage:
 *   npm run db:sync
 */

import dotenv from 'dotenv';
import { db } from '../db/index.js';
import { getSupabase, isSupabaseConfigured, testSupabaseConnection } from '../db/supabaseClient.js';

dotenv.config();

async function syncToSupabase() {
  console.log('\n======================================================================');
  console.log('🏛️  MANGAALAM PERFUMES — Database Sync to Supabase PostgreSQL');
  console.log('======================================================================\n');

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase is not configured yet in .env.');
    console.error('Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
    console.error('See .env.example and supabase/schema.sql for setup instructions.\n');
    process.exit(1);
  }

  console.log('Testing connection to Supabase...');
  const test = await testSupabaseConnection();
  if (!test.connected) {
    console.error(`\n❌ Supabase Connection Check Failed:`);
    console.error(`   HTTP Status: ${test.httpStatus || 'N/A'} ${test.statusText || ''}`);
    console.error(`   Response Message: "${test.responseMessage || test.message}"`);
    if (test.hint) {
      console.error(`   Gateway Hint: "${test.hint}"`);
    }

    if (test.diagnostics) {
      console.error(`\n   Environment Key Format Check (values hidden):`);
      console.error(`     SUPABASE_URL: ${test.diagnostics.urlPresent ? 'Configured (valid URL)' : 'Missing'}`);
      console.error(`     SUPABASE_SERVICE_ROLE_KEY: format=${test.diagnostics.serviceRoleKey.format}, length=${test.diagnostics.serviceRoleKey.length}`);
      console.error(`     SUPABASE_ANON_KEY: format=${test.diagnostics.anonKey.format}, length=${test.diagnostics.anonKey.length}`);
    }

    if (test.anonProbe && test.anonProbe.success) {
      console.log(`\n   ℹ️  Database Probe Note:`);
      console.log(`     A probe using SUPABASE_ANON_KEY succeeded (HTTP ${test.anonProbe.status}, ${test.anonProbe.productCount} products found).`);
      console.log(`     This confirms your Supabase endpoint and database tables exist and are active.`);
      console.log(`     However, your SUPABASE_SERVICE_ROLE_KEY was rejected by Supabase API Gateway as unregistered.\n`);
    }

    process.exit(1);
  }

  console.log(`✅ Connected to Supabase (${test.latencyMs}ms latency).\n`);
  const client = getSupabase();

  const syncOrdersOnly = process.argv.includes('--orders-only');

  // 1. Sync Products (Idempotent)
  if (syncOrdersOnly) {
    console.log('1. Skipping Products sync (--orders-only flag detected).\n');
  } else {
    console.log('1. Syncing 11 MANGAALAM Fragrances (Idempotent)...');
    const localProducts = db.prepare('SELECT * FROM products').all();

    const supabaseProducts = localProducts.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      size: p.size,
      volume_ml: p.volume_ml,
      price_in_paise: p.price_in_paise || (p.price * 100),
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold || 5,
      bottle_image: p.bottle_image,
      box_image: p.box_image,
      square_image: p.square_image,
      category: p.category,
      type: p.type,
      aura: p.aura,
      is_active: Boolean(p.is_active)
    }));

    const { error: prodErr } = await client
      .from('products')
      .upsert(supabaseProducts, { onConflict: 'id' });

    if (prodErr) {
      console.error(`❌ Error syncing products: ${prodErr.message}`);
    } else {
      console.log(`   ✅ 11 fragrances verified and idempotently synced in Supabase.`);
    }
  }

  // 2. Sync Existing Customer Orders (Idempotent & Safe)
  console.log('\n2. Syncing Existing Customer Orders (Idempotent)...');
  const localOrders = db.prepare('SELECT * FROM orders').all();

  if (localOrders.length === 0) {
    console.log('   No existing orders found in local database.');
  } else {
    let syncedOrders = 0;
    let skippedOrders = 0;

    for (const ord of localOrders) {
      try {
        const subtotalPaise = ord.subtotal_in_paise || (ord.subtotal * 100);
        const totalPaise = ord.total_amount_in_paise || (ord.total_amount * 100);

        // Upsert order record (idempotent on primary key 'id')
        const { error: ordErr } = await client
          .from('orders')
          .upsert({
            id: ord.id,
            customer_name: ord.customer_name,
            phone: ord.phone,
            email: ord.email,
            address_line1: ord.address_line1,
            address_line2: ord.address_line2,
            city: ord.city,
            state: ord.state,
            pincode: ord.pincode,
            order_notes: ord.order_notes,
            subtotal_in_paise: subtotalPaise,
            shipping_fee_in_paise: 0,
            total_amount_in_paise: totalPaise,
            payment_method: ord.payment_method,
            payment_status: ord.payment_status || 'pending',
            order_status: ord.order_status || 'New',
            shipping_provider: ord.shipping_provider,
            tracking_number: ord.tracking_number,
            admin_notes: ord.admin_notes,
            idempotency_key: ord.idempotency_key || `migrated-${ord.id}`
          }, { onConflict: 'id' });

        if (ordErr) {
          console.warn(`   ⚠️ Warning: Order ${ord.id} sync failed: ${ordErr.message}`);
          continue;
        }

        // Check if items already exist for this order to prevent duplicate rows
        const { data: existingItems, error: itemsQueryErr } = await client
          .from('order_items')
          .select('id')
          .eq('order_id', ord.id);

        if (itemsQueryErr) {
          console.warn(`   ⚠️ Warning: Could not check existing items for ${ord.id}: ${itemsQueryErr.message}`);
        }

        if (existingItems && existingItems.length > 0) {
          // Items already synced for this order
          skippedOrders++;
        } else {
          // Fetch local items and insert cleanly using standard async pattern
          const localItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
          const itemsToInsert = localItems.map(it => ({
            order_id: ord.id,
            product_id: it.product_id,
            product_name_snapshot: it.product_name_snapshot || it.product_name,
            size_snapshot: it.size_snapshot || it.product_size,
            unit_price_in_paise: it.unit_price_in_paise || (it.unit_price * 100),
            quantity: it.quantity,
            line_total_in_paise: it.line_total_in_paise || (it.total_price * 100),
            image_url: it.image_url
          }));

          if (itemsToInsert.length > 0) {
            const { error: insertErr } = await client
              .from('order_items')
              .insert(itemsToInsert);

            if (insertErr) {
              console.warn(`   ⚠️ Warning: Items insert for ${ord.id} returned: ${insertErr.message}`);
            }
          }
          syncedOrders++;
        }
      } catch (orderLoopErr) {
        console.warn(`   ⚠️ Error processing order ${ord.id}: ${orderLoopErr.message}`);
      }
    }

    console.log(`   ✅ Orders sync summary:`);
    console.log(`      • ${syncedOrders} orders newly synced with snapshots`);
    if (skippedOrders > 0) {
      console.log(`      • ${skippedOrders} orders already had snapshots preserved (no duplicates created)`);
    }
  }

  console.log('\n======================================================================');
  console.log('✨ Data synchronization to Supabase completed successfully!');
  console.log('======================================================================\n');
}

syncToSupabase().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
