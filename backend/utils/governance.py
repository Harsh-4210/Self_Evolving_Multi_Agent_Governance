# backend/utils/governance.py
import uuid
import time

class GovernanceModule:
    """
    Self-contained governance system for proposals and voting.
    Features:
    - Unique proposal IDs
    - Step-based timestamps
    - Weighted votes based on agent reputation
    - Detailed logging for analytics
    """

    def __init__(self, eligible_voters, vote_duration_steps=10):
        self.eligible_voters = set(eligible_voters)
        self.vote_duration = vote_duration_steps
        self.proposal_details = None
        self._reset_vote_state()

    def _reset_vote_state(self):
        """Reset all voting state except proposal details (kept for env rewards)."""
        self.is_vote_active = False
        self.votes = {}
        self.vote_start_step = -1
        self.outcome = None

    # ---------- Proposal ----------
    def start_proposal(self, proposed_by, rule, new_value, current_step):
        """
        Starts a new proposal if no vote is active.
        Assigns a unique proposal ID.
        """
        if self.is_vote_active:
            return False

        proposal_id = str(uuid.uuid4())
        self.is_vote_active = True
        self.proposal_details = {
            "id": proposal_id,
            "proposer": proposed_by,
            "rule": rule,
            "value": new_value,
            "start_step": current_step,
            "timestamp": time.time()
        }
        self.vote_start_step = current_step
        self.votes = {}
        self.outcome = None

        print(f"🏛️ Proposal Started [{proposal_id}] by {proposed_by}: Change '{rule}' → {new_value}")
        return True

    # ---------- Voting ----------
    def cast_vote(self, agent_id, vote, weight=1.0):
        """
        Record a vote from an eligible agent.
        Weight can be used for reputation-based voting.
        """
        if not self.is_vote_active or agent_id not in self.eligible_voters or agent_id in self.votes:
            return False
        
        self.votes[agent_id] = {"vote": vote, "weight": weight}
        print(f"🗳️ Vote Cast: {agent_id} voted {'Yes' if vote else 'No'} (weight={weight})")
        return True

    # ---------- Tally Votes ----------
    def tally_votes(self, current_step):
        """
        Tally votes if voting period is over.
        Uses simple weighted majority.
        """
        if not self.is_vote_active or self.outcome is not None:
            return None

        if current_step >= self.vote_start_step + self.vote_duration:
            yes_weight = sum(v['weight'] for v in self.votes.values() if v['vote'])
            no_weight = sum(v['weight'] for v in self.votes.values() if not v['vote'])

            self.outcome = 'passed' if yes_weight > no_weight else 'failed'

            print("-" * 40)
            print(f"✅ VOTING ENDED - Proposal [{self.proposal_details['id']}]")
            print(f"Rule: {self.proposal_details['rule']} → {self.proposal_details['value']}")
            print(f"Weighted Votes: Yes={yes_weight} | No={no_weight} → Outcome={self.outcome.upper()}")
            print("-" * 40)

            return self.outcome

        return None

    # ---------- End Voting ----------
    def end_voting_period(self):
        """Reset voting state after rewards are distributed."""
        self._reset_vote_state()
