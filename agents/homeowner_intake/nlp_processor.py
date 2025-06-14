# agents/homeowner_intake/nlp_processor.py
import os
import logging
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
import json

class NLPProcessor:
    """Uses a multimodal LLM to extract structured data from text and images."""
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY environment variable must be set.")
        # gpt-4o is inherently multimodal
        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0.0)

    def _create_multimodal_prompt(self, description: str, image_urls: List[str]) -> List[any]:
        """Creates a prompt list with both text and image content for gpt-4o."""
        content_parts = [{"type": "text", "text": description}]
        for url in image_urls:
            content_parts.append({
                "type": "image_url",
                "image_url": { "url": url }
            })
        return [HumanMessage(content=content_parts)]

    async def extract_project_info(self, description: str, image_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """Extracts structured information from a multimodal prompt (text and optional images)."""
        self.logger.info(f"Extracting project info with {len(image_urls or [])} images.")
        
        # The prompt now includes instructions for analyzing the image.
        prompt_text = f"""
        You are an expert construction project analyst. Analyze the following homeowner's project description AND any provided images. Your goal is to understand the project and identify what's missing.

        **User's Description:**
        "{description}"
        
        **Your Task:**
        1.  If images are provided, start your analysis by describing what you see (e.g., "I see a photo of a kitchen with a broken cabinet door.").
        2.  Based on the text and images, extract the following information in a structured JSON format.

        **JSON Output Format:**
        {{
          "initial_observation": "string (Your observation of the image, or null if no image provided)",
          "project_type": "string (e.g., 'kitchen_remodel', 'window_repair')",
          "requirements": ["list of key requirements from text and image"],
          "unclear_points": ["list of specific questions to ask for clarification"]
        }}
        """
        
        try:
            prompt = self._create_multimodal_prompt(prompt_text, image_urls or [])
            response = await self.llm.ainvoke(prompt)
            # The actual content is in the 'content' attribute of the AIMessage response
            json_response = response.content
            
            # Find the JSON block in the response string
            json_start = json_response.find('{')
            json_end = json_response.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = json_response[json_start:json_end]
                extracted_data = json.loads(json_str)
                self.logger.info(f"Successfully extracted multimodal data: {extracted_data}")
                return extracted_data
            else:
                raise json.JSONDecodeError("No JSON object found in response", json_response, 0)

        except Exception as e:
            self.logger.error(f"Multimodal NLP processing error: {e}", exc_info=True)
            return {"unclear_points": ["Could not fully analyze the project details."]}
