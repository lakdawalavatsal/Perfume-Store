#!/usr/bin/env node

/**
 * MANGAALAM PERFUMES — Private Owner Account Management CLI
 * 
 * Usage:
 *   node server/scripts/manage-admin.js create
 *   node server/scripts/manage-admin.js reset-password
 *   node server/scripts/manage-admin.js list
 */

import readline from 'readline';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const stdin = process.openStdin();
    process.stdin.on('data', charHandler);

    function charHandler(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.removeListener('data', charHandler);
          break;
        default:
          process.stdout.write('\x1B[2K\x1B[200D' + query + Array(rl.line.length + 1).join('*'));
          break;
      }
    }

    rl.question(query, (value) => {
      rl.history = rl.history.slice(1);
      rl.close();
      resolve(value);
    });
  });
}

function ask(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(query, ans => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function handleCreate(args) {
  console.log('\n======================================================================');
  console.log('🏛️  MANGAALAM PERFUMES — Secure Private Owner Account Setup');
  console.log('======================================================================\n');
  console.log('This tool initializes your private business owner account.');
  console.log('Your password will be securely hashed with bcrypt (12 rounds).\n');

  // Parse args or prompt
  let name = args.name || await ask('1. Enter Business Owner Name [Mrs. Manisha Mehta]: ');
  if (!name) name = 'Mrs. Manisha Mehta';

  let email = args.email || await ask('2. Enter Owner Email Address: ');
  while (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log('   ⚠️ Please enter a valid email address.');
    email = await ask('2. Enter Owner Email Address: ');
  }

  let username = email.split('@')[0];

  let password = args.password;
  if (!password) {
    password = await askHidden('3. Enter Secure Password (min 8 characters): ');
    while (!password || password.length < 8) {
      console.log('\n   ⚠️ Password must be at least 8 characters long.');
      password = await askHidden('3. Enter Secure Password (min 8 characters): ');
    }
    console.log('');

    const confirmPassword = await askHidden('4. Confirm Secure Password: ');
    console.log('');
    if (password !== confirmPassword) {
      console.error('❌ Error: Passwords do not match. Aborting setup.');
      process.exit(1);
    }
  }

  // Check if account already exists
  const existing = db.prepare('SELECT id, email FROM admins WHERE lower(email) = lower(?)').get(email);
  if (existing) {
    console.log(`\n⚠️  An account for "${email}" already exists (ID: ${existing.id}).`);
    const overwrite = args.yes ? 'y' : await ask('Do you wish to update this owner account password? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(password, salt);
    db.prepare(`
      UPDATE admins
      SET name = ?, password_hash = ?, token_version = token_version + 1, password_changed_at = datetime('now')
      WHERE id = ?
    `).run(name, hash, existing.id);

    console.log('\n✅ Owner credentials successfully updated.');
    console.log(`   Owner: ${name} (${email})`);
    console.log('   You can now access your private dashboard at /#admin.\n');
    process.exit(0);
  }

  // Insert new owner
  const salt = bcrypt.genSaltSync(12);
  const hash = bcrypt.hashSync(password, salt);

  db.prepare(`
    INSERT INTO admins (username, email, password_hash, name, role, token_version, password_changed_at)
    VALUES (?, ?, ?, ?, 'owner', 1, datetime('now'))
  `).run(username, email.toLowerCase(), hash, name);

  console.log('\n✅ Private owner account created successfully!');
  console.log(`   Owner Name:  ${name}`);
  console.log(`   Owner Email: ${email.toLowerCase()}`);
  console.log(`   Security:    Bcrypt (12 rounds), Zero plain-text storage`);
  console.log('\nYou can now log in to the private admin desk by opening /#admin in your browser.\n');
  process.exit(0);
}

async function handleResetPassword(args) {
  console.log('\n======================================================================');
  console.log('🔑 MANGAALAM PERFUMES — Emergency Owner Password Reset');
  console.log('======================================================================\n');

  let email = args.email || await ask('Enter Owner Email Address: ');
  const admin = db.prepare('SELECT id, email, name, token_version FROM admins WHERE lower(email) = lower(?)').get(email.trim());

  if (!admin) {
    console.error(`❌ Error: No owner account found with email "${email}".`);
    console.log('Run "npm run admin:create" to create a new owner account.');
    process.exit(1);
  }

  console.log(`Found registered owner account: ${admin.name} (${admin.email})`);

  let newPassword = args.password;
  if (!newPassword) {
    newPassword = await askHidden('Enter New Secure Password (min 8 characters): ');
    while (!newPassword || newPassword.length < 8) {
      console.log('\n   ⚠️ Password must be at least 8 characters long.');
      newPassword = await askHidden('Enter New Secure Password (min 8 characters): ');
    }
    console.log('');

    const confirmPassword = await askHidden('Confirm New Secure Password: ');
    console.log('');
    if (newPassword !== confirmPassword) {
      console.error('❌ Error: Passwords do not match. Aborting reset.');
      process.exit(1);
    }
  }

  const salt = bcrypt.genSaltSync(12);
  const newHash = bcrypt.hashSync(newPassword, salt);
  const nextTokenVersion = (admin.token_version || 1) + 1;

  db.prepare(`
    UPDATE admins
    SET password_hash = ?, token_version = ?, password_changed_at = datetime('now')
    WHERE id = ?
  `).run(newHash, nextTokenVersion, admin.id);

  console.log('\n✅ Password reset successful!');
  console.log(`   Owner: ${admin.email}`);
  console.log('   All previously active sessions have been invalidated.');
  console.log('   You can now log in at /#admin with your new password.\n');
  process.exit(0);
}

function handleList() {
  console.log('\n======================================================================');
  console.log('📋 MANGAALAM PERFUMES — Registered Owner Accounts');
  console.log('======================================================================\n');

  const admins = db.prepare(`
    SELECT id, username, email, name, role, token_version, last_login, password_changed_at, created_at
    FROM admins
  `).all();

  if (admins.length === 0) {
    console.log('No owner accounts currently registered.');
    console.log('Run "npm run admin:create" to set up your private owner account.');
  } else {
    console.table(admins.map(a => ({
      ID: a.id,
      Name: a.name,
      Email: a.email,
      Role: a.role,
      'Last Login': a.last_login || 'Never',
      'Password Updated': a.password_changed_at || a.created_at
    })));
  }
  console.log('');
  process.exit(0);
}

// Parse command line arguments
const command = process.argv[2] || 'help';
const rawArgs = process.argv.slice(3);
const parsedArgs = {};

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--email' && rawArgs[i + 1]) parsedArgs.email = rawArgs[++i];
  if (arg === '--name' && rawArgs[i + 1]) parsedArgs.name = rawArgs[++i];
  if (arg === '--password' && rawArgs[i + 1]) parsedArgs.password = rawArgs[++i];
  if (arg === '-y' || arg === '--yes') parsedArgs.yes = true;
}

switch (command) {
  case 'create':
  case 'init':
    handleCreate(parsedArgs);
    break;
  case 'reset-password':
  case 'reset':
    handleResetPassword(parsedArgs);
    break;
  case 'list':
    handleList();
    break;
  default:
    console.log(`
MANGAALAM Boutique Owner Administration CLI

Available Commands:
  npm run admin:create        Initialize a private owner account (prompts securely)
  npm run admin:reset         Reset the password for an existing owner account
  npm run admin:list          List registered owner accounts (metadata only)

Options:
  --email <email>             Specify owner email
  --name <name>               Specify owner name
  --password <pwd>            Specify password (use with caution in command history)
`);
    process.exit(0);
}
