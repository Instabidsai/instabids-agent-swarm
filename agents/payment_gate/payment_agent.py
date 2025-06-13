# agents/payment_gate/payment_agent.py

import json
import os
from typing import Dict, Any

from core.base.base_agent import BaseAgent
from core.memory.event_store import EventStore
from core.security.cost_breaker import CostCircuitBreaker
# In a real application, you would use the Stripe Python library and uncomment the following line
# import stripe

class PaymentGateAgent(BaseAgent):
    """Manages the payment workflow, including initiating payment requests
    based on scoped projects, verifying payment completion from webhooks,
    and triggering the secure release of contact information.
    """
    def __init__(self, agent_id: str = None):
        super().__init__(
            agent_type='payment_gate',
            stream_name='payment:events',
            group_name='payment_gate_processors',
            agent_id=agent_id
        )
        self.event_store = EventStore()
        self.cost_breaker = CostCircuitBreaker()
        # if not os.getenv("STRIPE_SECRET_KEY"):
        #     self.logger.warning("STRIPE_SECRET_KEY not set. Payment processing will be simulated.")
        # else:
        #     stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

    async def process_event(self, event_data: Dict[str, Any]) -> None:
        """Processes payment-related events from multiple upstream sources."""
        event_type = event_data.get('event_type')
        correlation_id = event_data.get('correlation_id')
        try:
            raw_data = json.loads(event_data.get('data', '{}'))
        except (json.JSONDecodeError, TypeError):
            self.logger.error(f"Invalid JSON data in event: {event_data}")
            return

        # This agent listens to two streams. In a real system, it would have two consumer instances.
        # Here we simulate this by checking the event type.
        if event_type == 'homeowner:scope_complete':
            await self._initiate_payment_flow(raw_data, correlation_id)
        elif event_type == 'stripe:webhook:payment_succeeded':
            await self._handle_payment_success(raw_data, correlation_id)
        else:
            self.logger.debug(f"PaymentGateAgent ignoring event type '{event_type}'.")

    async def _initiate_payment_flow(self, scope_data: Dict[str, Any], correlation_id: str):
        """Initiates a payment request once a project is ready."""
        project_id = scope_data.get('project_id')
        self.logger.info(f"Initiating payment flow for scoped project {project_id}.")

        # In a real system, you would calculate a price based on the scope.
        # This event would be consumed by a UI or notification service to prompt the user.
        await self.event_publisher.publish(
            stream='ui:updates',
            event_type='ui:payment_required',
            data={
                "project_id": project_id,
                "amount_cents": 2500,  # Example: $25.00
                "message": "Your project has been scoped. Please complete payment to connect with contractors.",
            },
            correlation_id=correlation_id
        )

    async def _handle_payment_success(self, payment_data: Dict[str, Any], correlation_id: str):
        """Handles confirmed payment and triggers contact release."""
        project_id = payment_data.get('metadata', {}).get('project_id')
        if not project_id:
            self.logger.error("Payment success event received without project_id in metadata.")
            return

        self.logger.info(f"Payment successful for project {project_id}. Releasing contact info.")

        # 1. Log the payment success event for auditing
        await self.event_store.append_event({
            "event_type": "payment:succeeded",
            "aggregate_id": project_id,
            "event_data": payment_data,
            "agent_id": self.agent_id,
            "correlation_id": correlation_id,
        })

        # 2. CRITICAL: Publish the contact release event.
        # This is the single source of truth that authorizes contact info to be shared.
        await self.event_publisher.publish(
            stream='payment:contact_released',
            event_type='payment:contact_released',
            data={
                "project_id": project_id,
                "transaction_id": payment_data.get('id'),
                "message": "Contact information is now authorized for release for this project.",
            },
            correlation_id=correlation_id
        )

