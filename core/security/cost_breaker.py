# core/security/cost_breaker.py
import os
import logging
from typing import Dict, Any

class CostCircuitBreaker:
    """
    Cost protection circuit breaker to prevent runaway LLM costs.
    Implements daily and per-event cost limits.
    """
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.daily_limit = float(os.getenv("COST_DAILY_LIMIT", "1000.0"))
        self.per_event_limit = float(os.getenv("COST_PER_EVENT_LIMIT", "0.05"))
        self.daily_spend = 0.0  # In production, this would be persisted
        
    def check_daily_limit(self, proposed_cost: float) -> bool:
        """Check if the proposed operation would exceed daily limits."""
        if self.daily_spend + proposed_cost > self.daily_limit:
            self.logger.error(f"Daily cost limit exceeded: {self.daily_spend + proposed_cost} > {self.daily_limit}")
            return False
        return True
    
    def check_per_event_limit(self, proposed_cost: float) -> bool:
        """Check if a single event exceeds per-event cost limits."""
        if proposed_cost > self.per_event_limit:
            self.logger.error(f"Per-event cost limit exceeded: {proposed_cost} > {self.per_event_limit}")
            return False
        return True
    
    def record_cost(self, actual_cost: float) -> None:
        """Record actual cost spent."""
        self.daily_spend += actual_cost
        self.logger.info(f"Cost recorded: ${actual_cost:.4f}. Daily total: ${self.daily_spend:.4f}")
