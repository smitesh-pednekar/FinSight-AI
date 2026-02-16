"""Risk detection and AI explanation service."""

import logging
from typing import Any
from datetime import datetime, timedelta
from decimal import Decimal

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate

from app.config import get_settings
from app.models import RiskLevel

logger = logging.getLogger(__name__)
settings = get_settings()


class RiskDetector:
    """
    Detect financial risks and anomalies.
    
    Detection is code-based. AI is used only for explanations.
    """
    
    def __init__(self):
        """Initialize risk detector."""
        if settings.google_api_key:
            logger.info("Initializing Gemini for risk explanations")
            self.llm = ChatGoogleGenerativeAI(
                model=settings.google_model,
                temperature=0.3,
                google_api_key=settings.google_api_key,
                convert_system_message_to_human=True,
            )
        else:
            logger.info("Initializing OpenAI for risk explanations")
            self.llm = ChatOpenAI(
                model=settings.openai_model,
                temperature=0.3,
                api_key=settings.openai_api_key,
            )
    
    def detect_invoice_risks(
        self,
        extracted_data: dict[str, Any],
        validation_results: list
    ) -> list[dict[str, Any]]:
        """
        Detect risks in invoice data.
        
        Args:
            extracted_data: Extracted invoice data
            validation_results: Validation results
            
        Returns:
            List of risk flags
        """
        risks = []
        
        # Risk 1: High-value invoice
        risks.extend(self._detect_high_value_invoice(extracted_data))
        
        # Risk 2: Unusual payment terms
        risks.extend(self._detect_unusual_payment_terms(extracted_data))
        
        # Risk 3: Round number suspicion
        risks.extend(self._detect_round_numbers(extracted_data))
        
        # Risk 4: Missing tax ID (compliance risk)
        risks.extend(self._detect_missing_tax_info(extracted_data))
        
        # Risk 5: Failed validations
        risks.extend(self._convert_validation_failures_to_risks(validation_results))
        
        return risks
    
    def _detect_high_value_invoice(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Detect high-value invoices."""
        total_amount = data.get("total_amount")
        
        if total_amount is None:
            return []
        
        try:
            amount = Decimal(str(total_amount))
            high_value_threshold = Decimal("10000")
            critical_threshold = Decimal("100000")
            
            if amount >= critical_threshold:
                return [{
                    "risk_type": "HIGH_VALUE_TRANSACTION",
                    "risk_level": RiskLevel.CRITICAL.value,
                    "description": f"Critical value invoice: {data.get('currency', 'USD')} {amount}",
                    "evidence": {
                        "amount": float(amount),
                        "threshold": float(critical_threshold),
                        "currency": data.get("currency", "USD")
                    }
                }]
            elif amount >= high_value_threshold:
                return [{
                    "risk_type": "HIGH_VALUE_TRANSACTION",
                    "risk_level": RiskLevel.MEDIUM.value,
                    "description": f"High value invoice: {data.get('currency', 'USD')} {amount}",
                    "evidence": {
                        "amount": float(amount),
                        "threshold": float(high_value_threshold),
                        "currency": data.get("currency", "USD")
                    }
                }]
        except (ValueError, TypeError):
            pass
        
        return []
    
    def _detect_unusual_payment_terms(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Detect unusual payment terms."""
        invoice_date_str = data.get("invoice_date")
        due_date_str = data.get("due_date")
        
        if not invoice_date_str or not due_date_str:
            return []
        
        try:
            invoice_date = datetime.fromisoformat(invoice_date_str.replace("Z", "+00:00"))
            due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
            
            payment_days = (due_date - invoice_date).days
            
            # Immediate payment (less than 7 days)
            if 0 <= payment_days < 7:
                return [{
                    "risk_type": "UNUSUAL_PAYMENT_TERMS",
                    "risk_level": RiskLevel.LOW.value,
                    "description": f"Immediate payment required ({payment_days} days)",
                    "evidence": {
                        "payment_days": payment_days,
                        "invoice_date": invoice_date_str,
                        "due_date": due_date_str
                    }
                }]
            
            # Very long payment terms (more than 90 days)
            elif payment_days > 90:
                return [{
                    "risk_type": "UNUSUAL_PAYMENT_TERMS",
                    "risk_level": RiskLevel.MEDIUM.value,
                    "description": f"Unusually long payment terms ({payment_days} days)",
                    "evidence": {
                        "payment_days": payment_days,
                        "invoice_date": invoice_date_str,
                        "due_date": due_date_str
                    }
                }]
        except (ValueError, TypeError):
            pass
        
        return []
    
    def _detect_round_numbers(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Detect suspiciously round numbers (potential fraud indicator)."""
        total_amount = data.get("total_amount")
        
        if total_amount is None:
            return []
        
        try:
            amount = Decimal(str(total_amount))
            
            # Check if it's a round number (e.g., 10000.00, 5000.00)
            if amount >= Decimal("1000"):
                # Check if last 2 digits are 00
                amount_str = str(amount)
                if amount_str.endswith("00.0") or amount_str.endswith("000"):
                    return [{
                        "risk_type": "ROUND_NUMBER_ANOMALY",
                        "risk_level": RiskLevel.LOW.value,
                        "description": f"Suspiciously round total amount: {data.get('currency', 'USD')} {amount}",
                        "evidence": {
                            "amount": float(amount),
                            "note": "Round numbers may indicate estimate rather than actual invoice"
                        }
                    }]
        except (ValueError, TypeError):
            pass
        
        return []
    
    def _detect_missing_tax_info(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        """Detect missing tax information (compliance risk)."""
        vendor_tax_id = data.get("vendor_tax_id")
        tax_amount = data.get("tax_amount")
        total_amount = data.get("total_amount")
        
        risks = []
        
        # Missing vendor tax ID
        if not vendor_tax_id:
            risks.append({
                "risk_type": "MISSING_TAX_INFORMATION",
                "risk_level": RiskLevel.MEDIUM.value,
                "description": "Vendor tax ID/GST number is missing",
                "evidence": {"missing_field": "vendor_tax_id"}
            })
        
        # Missing tax amount on significant invoice
        if tax_amount is None and total_amount:
            try:
                if Decimal(str(total_amount)) > Decimal("100"):
                    risks.append({
                        "risk_type": "MISSING_TAX_INFORMATION",
                        "risk_level": RiskLevel.MEDIUM.value,
                        "description": "Tax amount not specified on invoice",
                        "evidence": {"missing_field": "tax_amount", "total_amount": float(total_amount)}
                    })
            except (ValueError, TypeError):
                pass
        
        return risks
    
    def _convert_validation_failures_to_risks(
        self,
        validation_results: list
    ) -> list[dict[str, Any]]:
        """Convert failed validations to risk flags."""
        risks = []
        
        for validation in validation_results:
            if hasattr(validation, "is_valid") and not validation.is_valid:
                severity_to_risk = {
                    "ERROR": RiskLevel.HIGH.value,
                    "WARNING": RiskLevel.MEDIUM.value,
                }
                
                risk_level = severity_to_risk.get(
                    getattr(validation, "severity", "WARNING"),
                    RiskLevel.MEDIUM.value
                )
                
                risks.append({
                    "risk_type": "VALIDATION_FAILURE",
                    "risk_level": risk_level,
                    "description": f"Validation failed: {validation.validation_type}",
                    "evidence": {
                        "validation_type": validation.validation_type,
                        "error_message": validation.error_message,
                        "expected": validation.expected_value,
                        "actual": validation.actual_value,
                    }
                })
        
        return risks
    
    async def generate_ai_explanation(
        self,
        risk_flag: dict[str, Any],
        document_context: dict[str, Any]
    ) -> str:
        """
        Generate human-readable AI explanation for a risk flag.
        
        Args:
            risk_flag: Risk flag data
            document_context: Document and extraction context
            
        Returns:
            AI-generated explanation
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a financial auditor explaining risk flags to users.
Provide clear, professional explanations of why this risk was flagged.
Be specific and reference the evidence. Keep it concise (2-3 sentences)."""),
            ("user", """Explain this financial risk flag:

Risk Type: {risk_type}
Risk Level: {risk_level}
Description: {description}
Evidence: {evidence}

Document Type: {doc_type}
Context: {context}

Provide a clear explanation for non-technical users.""")
        ])
        
        chain = prompt | self.llm
        
        response = await chain.ainvoke({
            "risk_type": risk_flag.get("risk_type"),
            "risk_level": risk_flag.get("risk_level"),
            "description": risk_flag.get("description"),
            "evidence": str(risk_flag.get("evidence", {})),
            "doc_type": document_context.get("document_type", "Unknown"),
            "context": str(document_context.get("extracted_data", {}))[:500],
        })
        
        return response.content.strip()
