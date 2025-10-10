# from backend.db_connector import LocalDBConnector

# def test_db_connector():
#     db = LocalDBConnector(batch_interval=2)

#     # Log some test agent states
#     db.log_agent_state("test_agent_01", {
#         "cash_balance": 100,
#         "assets_held": 5,
#         "reputation": 1.0,
#         "tokens": 10,
#         "total_trades": 3
#     })

#     db.log_transaction("test_agent_01", "buy", 95.0, 2)

#     db.log_governance_event("proposal", "test_agent_01", {"proposal": "increase tax_rate"})

#     # Wait for any batch flushing
#     import time
#     time.sleep(5)

#     db.shutdown()
#     print("Test completed.")

# if __name__ == "__main__":
#     test_db_connector()


from backend.db_connector import LocalDBConnector
import time

def test_db_connector():
    db = LocalDBConnector(batch_interval=2)
    db.log_agent_state("test_agent_01", {
        "cash_balance": 100,
        "assets_held": 5,
        "reputation": 1.0,
        "tokens": 10,
        "total_trades": 3
    })
    db.log_transaction("test_agent_01", "buy", 95.0, 2)
    db.log_governance_event("proposal", "test_agent_01", {"proposal": "increase tax_rate"})
    time.sleep(5)  # allow batch flush
    db.shutdown()
    print("Test completed.")

if __name__ == "__main__":
    test_db_connector()
