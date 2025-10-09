# backend/utils/governance.py

class GovernanceModule:
    """
    A self-contained module to manage the proposal and voting process.
    It tracks the state of an active vote, accepts votes from agents,
    and tallies the results based on a simple majority.
    """

    def __init__(self, eligible_voters, vote_duration_steps=10):
        """
        Initializes the governance system.

        Args:
            eligible_voters (list): A list of agent IDs that are allowed to vote.
            vote_duration_steps (int): The number of environment steps a vote remains active.
        """
        self.eligible_voters = set(eligible_voters)
        self.vote_duration = vote_duration_steps
        self._reset_vote_state()

    def _reset_vote_state(self):
        """Internal method to reset all state variables to their default."""
        self.is_vote_active = False
        self.proposal_details = None  # e.g., {'rule': 'tax_rate', 'value': 0.03}
        self.votes = {}  # e.g., {'validator_0': True, 'validator_1': False}
        self.vote_start_step = -1
        self.outcome = None # Will be 'passed' or 'failed'

    def start_proposal(self, proposed_by, rule, new_value, current_step):
        """
        Starts a new voting process if one is not already active.

        Returns:
            bool: True if the proposal was successfully started, False otherwise.
        """
        if self.is_vote_active:
            # Cannot start a new proposal while another is active.
            return False

        print(f"🏛️ New Proposal Started by {proposed_by}: Change '{rule}' to '{new_value}'")
        self.is_vote_active = True
        self.proposal_details = {"proposer": proposed_by, "rule": rule, "value": new_value}
        self.vote_start_step = current_step
        self.votes = {} # Clear any previous votes
        self.outcome = None
        return True

    def cast_vote(self, agent_id, vote):
        """
        Records a vote from an eligible agent.

        Args:
            agent_id (str): The ID of the agent voting.
            vote (bool): The agent's vote (True for 'Yes', False for 'No').

        Returns:
            bool: True if the vote was successfully cast, False otherwise.
        """
        if not self.is_vote_active:
            # print(f"Vote Error: No active proposal for {agent_id} to vote on.")
            return False
        if agent_id not in self.eligible_voters:
            # print(f"Vote Error: {agent_id} is not eligible to vote.")
            return False
        if agent_id in self.votes:
            # print(f"Vote Error: {agent_id} has already voted.")
            return False

        # Record the valid vote
        self.votes[agent_id] = vote
        print(f"🗳️ Vote Cast: {agent_id} voted {'Yes' if vote else 'No'}")
        return True

    def tally_votes(self, current_step):
        """
        Checks if the voting period is over and tallies the results.

        Args:
            current_step (int): The current step of the main environment.

        Returns:
            str or None: 'passed', 'failed', or None if the vote is still active.
        """
        if not self.is_vote_active or self.outcome is not None:
            return self.outcome # Return None if not active, or the existing outcome

        # Check if the voting period has ended
        if current_step >= self.vote_start_step + self.vote_duration:
            yes_votes = sum(1 for v in self.votes.values() if v is True)
            no_votes = len(self.votes) - yes_votes

            print("-" * 20)
            print("VOTING PERIOD ENDED - TALLYING RESULTS")
            print(f"Proposal: Change '{self.proposal_details['rule']}' to '{self.proposal_details['value']}'")
            print(f"Results: {yes_votes} Yes vs. {no_votes} No")

            # Determine outcome with a simple majority
            if yes_votes > no_votes:
                self.outcome = 'passed'
            else:
                self.outcome = 'failed'
            
            print(f"Outcome: {self.outcome.upper()}")
            print("-" * 20)
            
            # Reset the state for the next proposal
            self._reset_vote_state()
            
            # Return the fresh outcome
            return self.outcome
        
        # If voting period is not over, return None
        return None