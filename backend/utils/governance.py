# backend/utils/governance.py

class GovernanceModule:
    """
    A self-contained module to manage the proposal and voting process.
    (Version 2: Separates tallying from state reset for reward distribution)
    """

    def __init__(self, eligible_voters, vote_duration_steps=10):
        """
        Initializes the governance system.
        """
        self.eligible_voters = set(eligible_voters)
        self.vote_duration = vote_duration_steps
        self.proposal_details = None
        self._reset_vote_state()

    def _reset_vote_state(self):
        """Internal method to reset all state variables to their default."""
        self.is_vote_active = False
        # We don't reset proposal_details here, so the env can read it after a vote
        self.votes = {}
        self.vote_start_step = -1
        self.outcome = None

    def start_proposal(self, proposed_by, rule, new_value, current_step):
        """
        Starts a new voting process if one is not already active.
        """
        if self.is_vote_active:
            return False

        print(f"🏛️ New Proposal Started by {proposed_by}: Change '{rule}' to '{new_value}'")
        self.is_vote_active = True
        self.proposal_details = {"proposer": proposed_by, "rule": rule, "value": new_value}
        self.vote_start_step = current_step
        self.votes = {} # Clear votes for the new proposal
        self.outcome = None
        return True

    def cast_vote(self, agent_id, vote):
        """
        Records a vote from an eligible agent.
        """
        # Return false if vote is not active, agent is not eligible, or agent has already voted
        if not self.is_vote_active or agent_id not in self.eligible_voters or agent_id in self.votes:
            return False
        
        # Record the valid vote
        self.votes[agent_id] = vote
        print(f"🗳️ Vote Cast: {agent_id} voted {'Yes' if vote else 'No'}")
        return True

    def tally_votes(self, current_step):
        """
        Checks if the voting period is over and determines the outcome.
        IMPORTANT: This version no longer resets the state automatically.
        """
        if not self.is_vote_active or self.outcome is not None:
            return None # Vote is not active or has already been tallied

        # Check if the voting period has ended
        if current_step >= self.vote_start_step + self.vote_duration:
            yes_votes = sum(1 for v in self.votes.values() if v is True)
            no_votes = len(self.votes) - yes_votes
            
            # Determine outcome with a simple majority
            self.outcome = 'passed' if yes_votes > no_votes else 'failed'
            
            print("-" * 20)
            print("VOTING PERIOD ENDED - TALLYING RESULTS")
            print(f"Proposal: Change '{self.proposal_details['rule']}' to '{self.proposal_details['value']}'")
            print(f"Results: {yes_votes} Yes vs. {no_votes} No -> {self.outcome.upper()}")
            print("-" * 20)
            
            return self.outcome
        
        # If voting period is not over, return None
        return None

    def end_voting_period(self):
        """
        Public method to be called by the environment AFTER distributing rewards
        to reset the state for the next proposal.
        """
        self._reset_vote_state()