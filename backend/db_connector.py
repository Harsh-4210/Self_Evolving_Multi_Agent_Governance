# backend/utils/db_connector.py
import os
from supabase import create_client, Client
from threading import Thread
import time

class SupabaseConnector:
    """
    Handles all communication with Supabase:
    - Batch logging for agent states, transactions, governance events, simulation runs.
    - Runs in a background thread to avoid blocking environment steps.
    """
    def __init__(self, batch_interval=5):
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set as environment variables.")

        self.client: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase!")

        # ---------- Buffers for batch writes ----------
        self.agent_state_buffer = []
        self.transaction_buffer = []
        self.governance_buffer = []
        self.simulation_run_buffer = []

        self.batch_interval = batch_interval
        self.running = True
        Thread(target=self._batch_writer, daemon=True).start()

    # ---------- Agent State ----------
    def log_agent_state(self, agent_id, state):
        net_worth = state.get("cash", 0) + state.get("assets", 0) * state.get("market_price", 100)
        self.agent_state_buffer.append({
            "agent_id": agent_id,
            "cash_balance": state.get('cash', 0),
            "assets_held": state.get('assets', 0),
            "reputation": state.get('reputation', 1.0),
            "tokens": state.get('tokens', 0),
            "net_worth": net_worth,
            "last_action": state.get('last_action', None),
            "total_trades": state.get('total_trades', 0)
        })

    # ---------- Transaction ----------
    def log_transaction(self, agent_id, action_type, price, quantity=1):
        self.transaction_buffer.append({
            "agent_id": agent_id,
            "action_type": action_type,
            "price": price,
            "quantity": quantity
        })

    # ---------- Governance ----------
    def log_governance_event(self, event_type, agent_id, details):
        self.governance_buffer.append({
            "event_type": event_type,
            "agent_id": agent_id,
            "details": details
        })

    # ---------- Simulation Runs ----------
    def log_simulation_run(self, agent_count, transaction_rate=0.0, proposal_frequency=0.0, conflict_probability=0.0):
        self.simulation_run_buffer.append({
            "agent_count": agent_count,
            "transaction_rate": transaction_rate,
            "proposal_frequency": proposal_frequency,
            "conflict_probability": conflict_probability
        })

    # ---------- Background batch writer ----------
    def _batch_writer(self):
        while self.running:
            time.sleep(self.batch_interval)
            self._flush_buffers()

    def _flush_buffers(self):
        try:
            if self.agent_state_buffer:
                self.client.table("agent_states").insert(self.agent_state_buffer).execute()
                self.agent_state_buffer.clear()
            if self.transaction_buffer:
                self.client.table("transactions").insert(self.transaction_buffer).execute()
                self.transaction_buffer.clear()
            if self.governance_buffer:
                self.client.table("governance_log").insert(self.governance_buffer).execute()
                self.governance_buffer.clear()
            if self.simulation_run_buffer:
                self.client.table("simulation_runs").insert(self.simulation_run_buffer).execute()
                self.simulation_run_buffer.clear()
        except Exception as e:
            print(f"[DB] Batch write failed: {e}")

    # ---------- Shutdown ----------
    def shutdown(self):
        self.running = False
        self._flush_buffers()
