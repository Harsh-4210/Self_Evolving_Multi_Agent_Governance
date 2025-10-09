// src/data.ts

// FIXED: The path should start with './' since these files are in the same 'src' directory.
import { supabase } from './supabaseClient';
import type { Agent, Proposal, RuleChange, Conflict, GovernanceMetrics } from './types/governance';

// The rest of the functions are correct
export async function fetchAgents(): Promise<Agent[]> {
  const { data, error } = await supabase.rpc('get_latest_agent_states');
  if (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
  return data || [];
}
/**
 * Fetches all proposals, ordered by their creation date.
 */
export async function fetchProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching proposals:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetches all rule changes, ordered by their timestamp.
 */
export async function fetchRuleChanges(): Promise<RuleChange[]> {
  const { data, error } = await supabase
    .from('rule_changes')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching rule changes:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetches all conflicts, ordered by their creation date.
 */
export async function fetchConflicts(): Promise<Conflict[]> {
  const { data, error } = await supabase
    .from('conflicts')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching conflicts:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetches the single row of global governance metrics.
 */
export async function fetchMetrics(): Promise<GovernanceMetrics | null> {
  const { data, error } = await supabase
    .from('governance_metrics')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching metrics:', error);
    throw error;
  }
  return data;
}