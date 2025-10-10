import os
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
import logging
import json
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class LocalDatabase:
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL',
            f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
            f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        )
        self.engine = create_engine(self.connection_string)

    def get_connection(self):
        return psycopg2.connect(self.connection_string)

    def execute_query(self, query, params=None, fetch=True):
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            if fetch:
                result = cursor.fetchall()
                conn.commit()
                cursor.close()
                conn.close()
                return [dict(row) for row in result]
            else:
                conn.commit()
                cursor.close()
                conn.close()
                return True
        except Exception as e:
            logger.error(f"Database error: {e}")
            if conn:
                conn.rollback()
                conn.close()
            raise e

    def insert_data(self, table_name, data):
        if not data:
            return False
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['%s'] * len(data))
        query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders}) RETURNING id"
        return self.execute_query(query, list(data.values()))

    def update_data(self, table_name, data, condition):
        set_clause = ', '.join([f"{k} = %s" for k in data.keys()])
        query = f"UPDATE {table_name} SET {set_clause} WHERE {condition}"
        return self.execute_query(query, list(data.values()), fetch=False)

    def select_data(self, table_name, columns="*", condition=None, params=None):
        query = f"SELECT {columns} FROM {table_name}"
        if condition:
            query += f" WHERE {condition}"
        return self.execute_query(query, params)

    def create_table(self, table_name, schema):
        query = f"CREATE TABLE IF NOT EXISTS {table_name} ({schema})"
        return self.execute_query(query, fetch=False)

class AgentDataManager:
    def __init__(self):
        self.db = LocalDatabase()
        self._ensure_tables()

    def _ensure_tables(self):
        self.db.create_table('agent_states', """
            id SERIAL PRIMARY KEY,
            agent_id VARCHAR(255) NOT NULL,
            state JSONB NOT NULL,
            reputation FLOAT DEFAULT 0.0,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """)
        self.db.create_table('governance_rules', """
            id SERIAL PRIMARY KEY,
            rule_id VARCHAR(255) UNIQUE NOT NULL,
            rule_data JSONB NOT NULL,
            votes JSONB DEFAULT '{}',
            status VARCHAR(50) DEFAULT 'proposed',
            created_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """)
        self.db.create_table('transactions', """
            id SERIAL PRIMARY KEY,
            transaction_id VARCHAR(255) UNIQUE NOT NULL,
            from_agent VARCHAR(255),
            to_agent VARCHAR(255),
            amount FLOAT,
            transaction_type VARCHAR(100),
            metadata JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """)
        self.db.create_table('conflicts', """
            id SERIAL PRIMARY KEY,
            conflict_id VARCHAR(255) UNIQUE NOT NULL,
            participants JSONB NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            resolution JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """)
        self.db.create_table('governance_log', """
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(255),
            agent_id VARCHAR(255),
            details JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """)

    def save_agent_state(self, agent_id, state_data):
        return self.db.insert_data('agent_states', {
            'agent_id': agent_id,
            'state': json.dumps(state_data),
            'reputation': state_data.get('reputation', 0.0)
        })

    def get_agent_state(self, agent_id):
        result = self.db.select_data('agent_states',
            condition="agent_id = %s ORDER BY created_at DESC LIMIT 1",
            params=[agent_id])
        return result[0] if result else None

    def save_governance_event(self, event_type: str, agent_id: str, details: dict):
        data = {
            'event_type': event_type,
            'agent_id': agent_id,
            'details': json.dumps(details)
        }
        return self.db.insert_data('governance_log', data)

    def save_transaction(self, transaction_data):
        return self.db.insert_data('transactions', transaction_data)

    def save_conflict(self, conflict_id, participants, status='active'):
        return self.db.insert_data('conflicts', {
            'conflict_id': conflict_id,
            'participants': json.dumps(participants),
            'status': status
        })

# Global instance
agent_data_manager = AgentDataManager()
