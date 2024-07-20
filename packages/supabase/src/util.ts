import { buckets } from "./constants";

export const getSupabaseListOGUrl = (listId: string) => {
  return `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${buckets.ogImages}/lists/${listId}.png`;
};
