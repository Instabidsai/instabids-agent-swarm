# agents/homeowner_intake/nlp_processor.py
import os
import logging
from typing import Dict, Any
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import json

class NLPProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable must be set.")
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0.0)
        self.chain = LLMChain(llm=self.llm, prompt=self._create_prompt_template())

    def _create_prompt_template(self) -> ChatPromptTemplate:
        template = """
        Analyze the following project description and extract the information in a structured JSON format.

        Description: "{description}"

        JSON Output Format:
        {{
          "project_type": "string",
          "requirements": ["list of key requirements"],
          "materials": ["list of materials mentioned"],
          "budget": "string or null",
          "timeline": "string or null",
          "unclear_points": ["list of questions for clarification"]
        }}
        """
        return ChatPromptTemplate.from_template(template)

    async def extract_project_info(self, description: str) -> Dict[str, Any]:
        self.logger.info("Extracting project info...")
        try:
            response = await self.chain.arun(description=description)
            return json.loads(response)
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to decode LLM response: {response}. Error: {e}")
            return {"unclear_points": ["Could not fully understand the project details."]}
        except Exception as e:
            self.logger.error(f"NLP processing error: {e}", exc_info=True)
            raise
