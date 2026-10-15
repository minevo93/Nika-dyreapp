import { createClient } from '@supabase/supabase-js';
import { createAccount } from './account-core.js';

// Publishable key only. OAuth client secrets stay in the provider/Supabase dashboards.
// Supabase validates every session and enforces private account access.
const config = {
  enabled: true,
  emailEnabled: true, // Verified SMTP; backend uses eight-digit email codes.
  url: 'https://irqcatqpllzzcktjnffq.supabase.co',
  key: 'sb_publishable_lq9Ny3bGWeTrphj_701ztQ_kXRPvrzQ',
  redirectTo: 'https://www.nikaappen.no/',
};
window.NikaAccount = createAccount({ config, createClient });
