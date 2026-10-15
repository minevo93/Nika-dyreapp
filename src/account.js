import { createClient } from '@supabase/supabase-js';
import { createAccount } from './account-core.js';

// Publishable key only. OAuth client secrets stay in the provider/Supabase dashboards.
// Temporary rollout switch, not an authorization boundary. Supabase validates every session.
const accountTest = new URLSearchParams(window.location.search).get('kontotest') === '1';
const config = {
  enabled: accountTest, // Public test link only until the real email round trip passes.
  emailEnabled: accountTest, // Verified SMTP; backend uses eight-digit email codes.
  url: 'https://irqcatqpllzzcktjnffq.supabase.co',
  key: 'sb_publishable_lq9Ny3bGWeTrphj_701ztQ_kXRPvrzQ',
  redirectTo: 'https://www.nikaappen.no/?kontotest=1',
};
window.NikaAccount = createAccount({ config, createClient });
