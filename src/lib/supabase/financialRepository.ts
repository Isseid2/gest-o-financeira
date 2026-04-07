import type { User } from '@supabase/supabase-js';
import type { AppState, ClientData, YearData } from '@/types/financial';
import { assertSupabase } from './client';
import {
  buildAppStateFromRows,
  toClientMetaPayload,
  toLocalMigrationPayload,
  toYearDataUpsertInput,
} from './mappers';

export async function ensureProfile(user: User) {
  const supabase = assertSupabase();
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? '',
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}

export async function loadFinancialState(userId: string, preferredYear: string): Promise<AppState> {
  const supabase = assertSupabase();

  const [{ data: clients, error: clientsError }, { data: years, error: yearsError }] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('client_year_data').select('*').eq('user_id', userId).order('year', { ascending: true }),
  ]);

  if (clientsError) throw clientsError;
  if (yearsError) throw yearsError;

  return buildAppStateFromRows(clients || [], years || [], preferredYear).appState;
}

export async function createClientRecord(userId: string, client: ClientData, activeYear: string) {
  const supabase = assertSupabase();
  const clientPayload = toClientMetaPayload(userId, client);
  const yearPayload = toYearDataUpsertInput(userId, client.id, activeYear, client.anos[activeYear]);

  const { error: clientError } = await supabase.from('clients').insert(clientPayload);
  if (clientError) throw clientError;

  const { error: yearError } = await supabase.from('client_year_data').upsert(yearPayload, { onConflict: 'client_id,year' });
  if (yearError) throw yearError;
}

export async function deleteClientRecord(clientId: string) {
  const supabase = assertSupabase();
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw error;
}

export async function upsertClientRecord(userId: string, client: ClientData) {
  const supabase = assertSupabase();
  const payload = toClientMetaPayload(userId, client);
  const { error } = await supabase.from('clients').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertYearDataRecord(userId: string, clientId: string, year: string, yearData: YearData) {
  const supabase = assertSupabase();
  const payload = toYearDataUpsertInput(userId, clientId, year, yearData);
  const { error } = await supabase.from('client_year_data').upsert(payload, { onConflict: 'client_id,year' });
  if (error) throw error;
}

export async function migrateLocalStateToRemote(userId: string, state: AppState) {
  const supabase = assertSupabase();
  const payload = toLocalMigrationPayload(userId, state);

  if (payload.clients.length > 0) {
    const { error: clientError } = await supabase.from('clients').upsert(payload.clients, { onConflict: 'id' });
    if (clientError) throw clientError;
  }

  if (payload.years.length > 0) {
    const { error: yearsError } = await supabase.from('client_year_data').upsert(payload.years, {
      onConflict: 'client_id,year',
    });
    if (yearsError) throw yearsError;
  }
}
