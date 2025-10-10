import atexit
import threading
from database.local_db import agent_data_manager

class LocalDBConnector:
    """
    Handles all communication with the local PostgreSQL database, with batching.
    """
    def __init__(self, batch_interval=5):
        self.batch_interval = batch_interval
        self.log_batches = {
            'agent_states': [],
            'transactions': [],
            'governance_log': []
        }
        self.lock = threading.Lock()
        atexit.register(self.shutdown)

        self.flush_timer = threading.Timer(self.batch_interval, self._periodic_flush)
        self.flush_timer.daemon = True
        self.flush_timer.start()

    def _periodic_flush(self):
        with self.lock:
            for table_name in list(self.log_batches.keys()):
                self._flush_batch(table_name)
        self.flush_timer = threading.Timer(self.batch_interval, self._periodic_flush)
        self.flush_timer.daemon = True
        self.flush_timer.start()

    def _flush_batch(self, table_name):
        batch = self.log_batches.get(table_name, [])
        if not batch:
            return
        try:
            if table_name == 'agent_states':
                for data in batch:
                    agent_id = data.pop('agent_id')
                    agent_data_manager.save_agent_state(agent_id, data)
            elif table_name == 'transactions':
                for data in batch:
                    agent_id = data.pop('agent_id', None)
                    agent_data_manager.save_transaction({'agent_id': agent_id, **data})
            elif table_name == 'governance_log':
                for data in batch:
                    event_type = data.get('event_type')
                    agent_id = data.get('agent_id')
                    details = data.get('details')
                    agent_data_manager.save_governance_event(event_type, agent_id, details)
            self.log_batches[table_name] = []
        except Exception as e:
            print(f"[DB] Batch write failed for table '{table_name}': {e}")

    def log_agent_state(self, agent_id: str, state: dict):
        data = {
            "cash": state.get("cash_balance", 0),
            "assets": state.get("assets_held", 0),
            "reputation": state.get("reputation", 1.0),
            "tokens": state.get("tokens", 0),
            "total_trades": state.get("total_trades", 0),
        }
        with self.lock:
            batch_data = {'agent_id': agent_id}
            batch_data.update(data)
            self.log_batches['agent_states'].append(batch_data)
            if len(self.log_batches['agent_states']) >= self.batch_interval:
                self._flush_batch('agent_states')

    def log_transaction(self, agent_id: str, action_type: str, price: float, quantity: int = 1):
        data = {
            'agent_id': agent_id,
            'action_type': action_type,
            'price': price,
            'quantity': quantity,
        }
        with self.lock:
            self.log_batches['transactions'].append(data)
            if len(self.log_batches['transactions']) >= self.batch_interval:
                self._flush_batch('transactions')

    def log_governance_event(self, event_type: str, agent_id: str, details: dict):
        data = {
            'event_type': event_type,
            'agent_id': agent_id,
            'details': details
        }
        with self.lock:
            self.log_batches['governance_log'].append(data)
            if len(self.log_batches['governance_log']) >= self.batch_interval:
                self._flush_batch('governance_log')

    def log_simulation_run(self, agent_count: int, details: dict = None):
        try:
            print(f"[DB] Simulation run logged: agent_count={agent_count}, details={details}")
        except Exception as e:
            print(f"Error logging simulation run: {e}")

    def shutdown(self):
        print("\n[DB] Shutting down connector and flushing remaining logs...")
        with self.lock:
            for table_name in list(self.log_batches.keys()):
                self._flush_batch(table_name)
        print("[DB] Log flushing complete.")
        if self.flush_timer.is_alive():
            self.flush_timer.cancel()
