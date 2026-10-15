import { createClient } from '@supabase/supabase-js';
import { createAccount } from './account-core.js';

// Publishable key only. OAuth client secrets stay in the provider/Supabase dashboards.
const config = {
  enabled: false, // Enable after a configured method passes real login tests.
  emailEnabled: false, // Requires verified Resend SMTP and six-digit email templates.
  url: 'https://irqcatqpllzzcktjnffq.supabase.co',
  key: 'sb_publishable_lq9Ny3bGWeTrphj_701ztQ_kXRPvrzQ',
  redirectTo: 'https://www.nikaappen.no/',
};
window.NikaAccount = createAccount({ config, createClient });
