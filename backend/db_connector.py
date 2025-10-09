# db_connector.py
import os
from supabase import create_client, Client

class SupabaseConnector:
    """
    Handles all communication with the Supabase database.
    """
    def __init__(self):
        # Fetch credentials from environment variables for security
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set as environment variables.")
            
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            print("✅ Successfully connected to Supabase!")
        except Exception as e:
            print(f"🔥 Failed to connect to Supabase: {e}")
            self.client = None

    def log_transaction(self, agent_id: str, action_type: str, price: float, quantity: int = 1):
        """Logs a single buy or sell transaction."""
        if not self.client: return
        try:
            data = {
                "agent_id": agent_id,
                "action_type": action_type,
                "price": price,
                "quantity": quantity
            }
            self.client.table('transactions').insert(data).execute()
        except Exception as e:
            print(f"Error logging transaction: {e}")

    def log_agent_state(self, agent_id: str, state: dict):
        """Logs a snapshot of an agent's current state."""
        if not self.client: return
        try:
            data = {
                "agent_id": agent_id,
                "cash_balance": state.get('cash', 0),
                "assets_held": state.get('assets', 0),
                "reputation": state.get('reputation', 1.0),
                "tokens": state.get('tokens', 0)
            }
            self.client.table('agent_states').insert(data).execute()
        except Exception as e:
            print(f"Error logging agent state: {e}")

    def log_governance_event(self, event_type: str, agent_id: str, details: dict):
        """Logs a governance event like a proposal or a vote."""
        if not self.client: return
        try:
            data = {
                "event_type": event_type,
                "agent_id": agent_id,
                "details": details
            }
            self.client.table('governance_log').insert(data).execute()
        except Exception as e:
            print(f"Error logging governance event: {e}")