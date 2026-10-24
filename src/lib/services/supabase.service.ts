import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$lib/constants/supabase.constants';
import { isNullish } from '$lib/utils/nullish.utils';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/** Lazily created so prerendering never opens a connection. */
export const supabase = (): SupabaseClient => {
	if (isNullish(client)) {
		client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
			auth: { persistSession: false, autoRefreshToken: false }
		});
	}

	return client;
};
