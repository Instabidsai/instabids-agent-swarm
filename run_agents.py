#!/usr/bin/env python3
"""
Agent Runner Script - Starts individual agents for the InstaBids Agent Swarm
"""
import asyncio
import signal
import sys
import os
from typing import Dict, Any

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.homeowner_intake.intake_agent import HomeownerIntakeAgent
from agents.project_scope.scope_agent import ProjectScopeAgent
from agents.communication_filter.filter_agent import CommunicationFilterAgent
from agents.payment_gate.payment_agent import PaymentGateAgent
from agents.ui_generator.ui_agent import UIGeneratorAgent

# Environment variables must be set before running
REQUIRED_ENV_VARS = [
    "REDIS_URL", 
    "SUPABASE_URL", 
    "SUPABASE_SERVICE_ROLE_KEY", 
    "OPENAI_API_KEY"
]

def check_environment():
    """Verify all required environment variables are set."""
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        print("Please set these environment variables before running agents.")
        return False
    return True

AGENT_MAP = {
    "intake": HomeownerIntakeAgent,
    "scope": ProjectScopeAgent, 
    "filter": CommunicationFilterAgent,
    "payment": PaymentGateAgent,
    "ui": UIGeneratorAgent
}

class AgentRunner:
    def __init__(self):
        self.agents = []
        self.running = True

    async def start_agent(self, agent_type: str, agent_id: str = None):
        """Start a specific agent type."""
        if agent_type not in AGENT_MAP:
            print(f"❌ Unknown agent type: {agent_type}")
            return False
            
        try:
            AgentClass = AGENT_MAP[agent_type]
            agent = AgentClass(agent_id=agent_id)
            print(f"🤖 Starting {agent_type} agent: {agent.agent_id}")
            
            task = asyncio.create_task(agent.start_processing())
            self.agents.append((agent, task))
            print(f"✅ {agent_type} agent started successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to start {agent_type} agent: {e}")
            return False

    async def start_all_agents(self):
        """Start all agents in the swarm."""
        print("🌊 Starting InstaBids Agent Swarm...")
        
        for agent_type in AGENT_MAP.keys():
            await self.start_agent(agent_type)
            await asyncio.sleep(1)  # Stagger startup
        
        print(f"🚀 Agent Swarm fully operational with {len(self.agents)} agents!")

    async def shutdown(self):
        """Gracefully shutdown all agents."""
        print("\n🛑 Shutting down Agent Swarm...")
        self.running = False
        
        for agent, task in self.agents:
            try:
                await agent.graceful_shutdown()
                task.cancel()
                print(f"✅ {agent.agent_type} agent shut down")
            except Exception as e:
                print(f"⚠️ Error shutting down {agent.agent_type}: {e}")
        
        print("👋 Agent Swarm shutdown complete.")

    async def run_forever(self):
        """Keep the runner alive."""
        try:
            while self.running:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            await self.shutdown()

def setup_signal_handlers(runner):
    """Setup graceful shutdown on SIGINT/SIGTERM."""
    def signal_handler(signum, frame):
        print(f"\n📡 Received signal {signum}")
        asyncio.create_task(runner.shutdown())
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

async def main():
    """Main entry point."""
    if not check_environment():
        return
        
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python run_agents.py all              # Start all agents")
        print("  python run_agents.py intake           # Start intake agent only")
        print("  python run_agents.py scope            # Start scope agent only")
        print("  python run_agents.py filter           # Start filter agent only")
        print("  python run_agents.py payment          # Start payment agent only")
        print("  python run_agents.py ui               # Start UI agent only")
        return

    runner = AgentRunner()
    setup_signal_handlers(runner)
    
    command = sys.argv[1]
    
    if command == "all":
        await runner.start_all_agents()
        await runner.run_forever()
    elif command in AGENT_MAP:
        agent_id = sys.argv[2] if len(sys.argv) > 2 else None
        success = await runner.start_agent(command, agent_id)
        if success:
            await runner.run_forever()
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    asyncio.run(main())
