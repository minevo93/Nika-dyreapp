import { createClient } from '@supabase/supabase-js';
import { createAccount } from './account-core.js';

// Publishable key only. OAuth client secrets stay in the provider/Supabase dashboards.
const config = {
  enabled: false, // Enable only after both providers and real login tests are complete.
  url: 'https://irqcatqpllzzcktjnffq.supabase.co',
  key: 'sb_publishable_lq9Ny3bGWeTrphj_701ztQ_kXRPvrzQ',
  redirectTo: 'https://nika-dyreapp.netlify.app/',
};
window.NikaAccount = createAccount({ config, createClient });
