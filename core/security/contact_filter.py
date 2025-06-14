# core/security/contact_filter.py
import re
from typing import Dict, List

class ContactProtectionFilter:
    PHONE_PATTERNS = [
        re.compile(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b'),
        re.compile(r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}'),
        re.compile(r'\b\d{10}\b'),
        re.compile(r'\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'),
    ]
    EMAIL_PATTERNS = [
        # Standard email format
        re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
        # Obfuscated format like "name [at] domain [dot] com"
        re.compile(r'\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\s*\[\s*dot\s*\]\s*[A-Z|a-z]{2,}', re.IGNORECASE),
        # Spelled-out format like "name AT domain DOT com"
        re.compile(r'\b[A-Za-z0-9._%+-]+\s*(?:at|@)\s*[A-Za-z0-9.-]+\s*(?:dot|\.)\s*[A-Za-z]{2,}\b', re.IGNORECASE),
    ]
    INTENT_PATTERNS = [
        re.compile(r'\b(call|text|email|contact|reach)\s+me\b', re.IGNORECASE),
        re.compile(r'\bmy\s+(number|phone|cell|email)\b', re.IGNORECASE),
        re.compile(r'\b(whatsapp|telegram|signal)\b', re.IGNORECASE),
    ]

    def scan_content(self, content: str) -> Dict[str, List[str]]:
        violations: Dict[str, List[str]] = {"phones": [], "emails": [], "intent": []}
        for pattern in self.PHONE_PATTERNS:
            violations["phones"].extend(pattern.findall(content))
        for pattern in self.EMAIL_PATTERNS:
            violations["emails"].extend(pattern.findall(content))
        for pattern in self.INTENT_PATTERNS:
            violations["intent"].extend(pattern.findall(content))
        return violations

    def scrub_content(self, content: str) -> str:
        scrubbed_content = content
        all_patterns = self.PHONE_PATTERNS + self.EMAIL_PATTERNS
        for pattern in all_patterns:
            scrubbed_content = pattern.sub("[FILTERED]", scrubbed_content)
        return scrubbed_content
