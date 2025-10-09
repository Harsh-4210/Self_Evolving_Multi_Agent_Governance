# backend/utils/db_connector.py

import os
import time
from supabase import create_client, Client
import atexit

class SupabaseConnector:
    """
    Handles all communication with the Supabase database, with batching.
    """
    def __init__(self, batch_interval=5):
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set as environment variables.")
            
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase!")
        except Exception as e:
            print(f"🔥 Failed to connect to Supabase: {e}")
            self.client = None

        # --- Batching setup ---
        self.batch_interval = batch_interval
        self.log_batches = {
            'agent_states': [],
            'transactions': [],
            'governance_log': []
        }
        # Ensure remaining logs are sent on exit
        atexit.register(self.shutdown)

    def _flush_batch(self, table_name):
        """Internal method to write a batch to a specific table."""
        if not self.client or not self.log_batches[table_name]:
            return
        
        try:
            self.client.table(table_name).insert(self.log_batches[table_name]).execute()
            # print(f"[DB] Flushed {len(self.log_batches[table_name])} logs to '{table_name}'.")
        except Exception as e:
            print(f"[DB] Batch write failed for table '{table_name}': {e}")
        finally:
            self.log_batches[table_name] = []

    # --- Public Logging Methods ---

    def log_agent_state(self, agent_id: str, state: dict):
        """Queues a snapshot of an agent's current state for batch insert."""
        data = {
            "agent_id": agent_id,
            "cash_balance": state.get('cash', 0),
            "assets_held": int(state.get('assets', 0)),          # FIX: Cast to integer
            "reputation": state.get('reputation', 1.0),
            "tokens": int(state.get('tokens', 0)),              # FIX: Cast to integer
            "total_trades": int(state.get("total_trades", 0))  # FIX: Cast to integer
        }
        self.log_batches['agent_states'].append(data)
        if len(self.log_batches['agent_states']) >= self.batch_interval:
            self._flush_batch('agent_states')

    def log_transaction(self, agent_id: str, action_type: str, price: float, quantity: int = 1):
        """Queues a single buy or sell transaction."""
        data = {
            "agent_id": agent_id,
            "action_type": action_type,
            "price": price,
            "quantity": quantity
        }
        self.log_batches['transactions'].append(data)
        if len(self.log_batches['transactions']) >= self.batch_interval:
            self._flush_batch('transactions')

    def log_governance_event(self, event_type: str, agent_id: str, details: dict):
        """Queues a governance event like a proposal or a vote."""
        data = {
            "event_type": event_type,
            "agent_id": agent_id,
            "details": details
        }
        self.log_batches['governance_log'].append(data)
        if len(self.log_batches['governance_log']) >= self.batch_interval:
            self._flush_batch('governance_log')
            
    def log_simulation_run(self, agent_count: int, details: dict = None):
        """Logs the start of a new simulation run (does not batch)."""
        if not self.client: return
        try:
            data = {"agent_count": agent_count, "details": details or {}}
            self.client.table('simulation_runs').insert(data).execute()
        except Exception as e:
            print(f"Error logging simulation run: {e}")

    def shutdown(self):
        """Flushes all remaining logs from all batches."""
        print("\n[DB] Shutting down connector and flushing remaining logs...")
        for table_name in self.log_batches.keys():
            self._flush_batch(table_name)
        print("[DB] Log flushing complete.")