"""Financial validation engine - CODE-BASED validations only."""

import logging
from typing import Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal

logger = logging.getLogger(__name__)


class ValidationResult:
    """Result of a validation check."""
    
    def __init__(
        self,
        validation_type: str,
        is_valid: bool,
        expected_value: Optional[Any] = None,
        actual_value: Optional[Any] = None,
        error_message: Optional[str] = None,
        severity: str = "ERROR"
    ):
        self.validation_type = validation_type
        self.is_valid = is_valid
        self.expected_value = expected_value
        self.actual_value = actual_value
        self.error_message = error_message
        self.severity = severity


class FinancialValidator:
    """
    Code-based financial validation engine.
    
    AI is NOT used for validation - only for explanations.
    All validation logic is deterministic and rule-based.
    """
    
    def __init__(self):
        """Initialize validator."""
        self.validation_results: list[ValidationResult] = []
    
    def validate_invoice(self, extracted_data: dict[str, Any]) -> list[ValidationResult]:
        """
        Validate invoice data using deterministic rules.
        
        Args:
            extracted_data: Extracted invoice data
            
        Returns:
            List of validation results
        """
        results = []
        
        # Rule 1: Total = Subtotal + Tax
        results.append(self._validate_invoice_total(extracted_data))
        
        # Rule 2: Line items sum to subtotal
        results.append(self._validate_line_items_sum(extracted_data))
        
        # Rule 3: Tax calculation
        results.append(self._validate_tax_calculation(extracted_data))
        
        # Rule 4: Required fields present
        results.append(self._validate_required_fields(extracted_data))
        
        # Rule 5: Date logic
        results.append(self._validate_dates(extracted_data))
        
        # Rule 6: Negative amounts
        results.append(self._validate_no_negative_amounts(extracted_data))
        
        return [r for r in results if r is not None]
    
    def _validate_invoice_total(self, data: dict[str, Any]) -> Optional[ValidationResult]:
        """Validate: total = subtotal + tax."""
        subtotal = data.get("subtotal")
        tax_amount = data.get("tax_amount")
        total_amount = data.get("total_amount")
        
        if not all([subtotal is not None, tax_amount is not None, total_amount is not None]):
            return ValidationResult(
                validation_type="INVOICE_TOTAL_CALCULATION",
                is_valid=False,
                error_message="Missing subtotal, tax, or total amount",
                severity="ERROR"
            )
        
        try:
            subtotal = Decimal(str(subtotal))
            tax_amount = Decimal(str(tax_amount))
            total_amount = Decimal(str(total_amount))
            
            expected_total = subtotal + tax_amount
            
            # Allow 0.01 difference for rounding
            difference = abs(expected_total - total_amount)
            
            if difference > Decimal("0.01"):
                return ValidationResult(
                    validation_type="INVOICE_TOTAL_CALCULATION",
                    is_valid=False,
                    expected_value=float(expected_total),
                    actual_value=float(total_amount),
                    error_message=f"Total amount mismatch. Expected {expected_total}, got {total_amount}",
                    severity="ERROR"
                )
            
            return ValidationResult(
                validation_type="INVOICE_TOTAL_CALCULATION",
                is_valid=True
            )
        except (ValueError, TypeError) as e:
            return ValidationResult(
                validation_type="INVOICE_TOTAL_CALCULATION",
                is_valid=False,
                error_message=f"Invalid numeric values: {str(e)}",
                severity="ERROR"
            )
    
    def _validate_line_items_sum(self, data: dict[str, Any]) -> Optional[ValidationResult]:
        """Validate: sum of line items equals subtotal."""
        line_items = data.get("line_items", [])
        subtotal = data.get("subtotal")
        
        if not line_items or subtotal is None:
            return None
        
        try:
            line_items_total = Decimal("0")
            for item in line_items:
                if isinstance(item, dict):
                    quantity = Decimal(str(item.get("quantity", 0)))
                    price = Decimal(str(item.get("unit_price", 0)))
                    line_items_total += quantity * price
            
            subtotal = Decimal(str(subtotal))
            difference = abs(line_items_total - subtotal)
            
            if difference > Decimal("0.01"):
                return ValidationResult(
                    validation_type="LINE_ITEMS_SUM",
                    is_valid=False,
                    expected_value=float(subtotal),
                    actual_value=float(line_items_total),
                    error_message=f"Line items sum ({line_items_total}) does not match subtotal ({subtotal})",
                    severity="ERROR"
                )
            
            return ValidationResult(
                validation_type="LINE_ITEMS_SUM",
                is_valid=True
            )
        except (ValueError, TypeError, KeyError) as e:
            return ValidationResult(
                validation_type="LINE_ITEMS_SUM",
                is_valid=False,
                error_message=f"Error calculating line items sum: {str(e)}",
                severity="WARNING"
            )
    
    def _validate_tax_calculation(self, data: dict[str, Any]) -> Optional[ValidationResult]:
        """Validate: tax amount matches tax rate × subtotal."""
        subtotal = data.get("subtotal")
        tax_amount = data.get("tax_amount")
        tax_rate = data.get("tax_rate")
        
        if not all([subtotal is not None, tax_amount is not None, tax_rate is not None]):
            return None
        
        try:
            subtotal = Decimal(str(subtotal))
            tax_amount = Decimal(str(tax_amount))
            tax_rate = Decimal(str(tax_rate)) / Decimal("100")
            
            expected_tax = subtotal * tax_rate
            difference = abs(expected_tax - tax_amount)
            
            if difference > Decimal("0.01"):
                return ValidationResult(
                    validation_type="TAX_CALCULATION",
                    is_valid=False,
                    expected_value=float(expected_tax),
                    actual_value=float(tax_amount),
                    error_message=f"Tax calculation mismatch. Expected {expected_tax}, got {tax_amount}",
                    severity="WARNING"
                )
            
            return ValidationResult(
                validation_type="TAX_CALCULATION",
                is_valid=True
            )
        except (ValueError, TypeError) as e:
            return ValidationResult(
                validation_type="TAX_CALCULATION",
                is_valid=False,
                error_message=f"Error in tax calculation: {str(e)}",
                severity="WARNING"
            )
    
    def _validate_required_fields(self, data: dict[str, Any]) -> ValidationResult:
        """Validate: all required fields are present."""
        required_fields = [
            "invoice_number",
            "invoice_date",
            "vendor_name",
            "total_amount"
        ]
        
        missing_fields = []
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            return ValidationResult(
                validation_type="REQUIRED_FIELDS",
                is_valid=False,
                error_message=f"Missing required fields: {', '.join(missing_fields)}",
                severity="ERROR"
            )
        
        return ValidationResult(
            validation_type="REQUIRED_FIELDS",
            is_valid=True
        )
    
    def _validate_dates(self, data: dict[str, Any]) -> Optional[ValidationResult]:
        """Validate: date logic (due date after invoice date)."""
        invoice_date_str = data.get("invoice_date")
        due_date_str = data.get("due_date")
        
        if not invoice_date_str or not due_date_str:
            return None
        
        try:
            invoice_date = datetime.fromisoformat(invoice_date_str.replace("Z", "+00:00"))
            due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
            
            if due_date < invoice_date:
                return ValidationResult(
                    validation_type="DATE_LOGIC",
                    is_valid=False,
                    expected_value=f"Due date >= {invoice_date_str}",
                    actual_value=due_date_str,
                    error_message="Due date is before invoice date",
                    severity="ERROR"
                )
            
            # Warning if due date is more than 1 year in future
            if due_date > invoice_date + timedelta(days=365):
                return ValidationResult(
                    validation_type="DATE_LOGIC",
                    is_valid=False,
                    error_message="Due date is more than 1 year from invoice date",
                    severity="WARNING"
                )
            
            return ValidationResult(
                validation_type="DATE_LOGIC",
                is_valid=True
            )
        except (ValueError, TypeError) as e:
            return ValidationResult(
                validation_type="DATE_LOGIC",
                is_valid=False,
                error_message=f"Invalid date format: {str(e)}",
                severity="WARNING"
            )
    
    def _validate_no_negative_amounts(self, data: dict[str, Any]) -> ValidationResult:
        """Validate: no negative amounts (fraud indicator)."""
        fields_to_check = ["subtotal", "tax_amount", "total_amount"]
        
        negative_fields = []
        for field in fields_to_check:
            value = data.get(field)
            if value is not None:
                try:
                    if Decimal(str(value)) < 0:
                        negative_fields.append(field)
                except (ValueError, TypeError):
                    pass
        
        if negative_fields:
            return ValidationResult(
                validation_type="NEGATIVE_AMOUNTS",
                is_valid=False,
                error_message=f"Negative amounts detected in: {', '.join(negative_fields)}",
                severity="ERROR"
            )
        
        return ValidationResult(
            validation_type="NEGATIVE_AMOUNTS",
            is_valid=True
        )
    
    def validate_bank_statement(self, extracted_data: dict[str, Any]) -> list[ValidationResult]:
        """Validate bank statement data."""
        results = []
        
        # Rule 1: Closing balance = Opening balance + Credits - Debits
        results.append(self._validate_bank_balance(extracted_data))
        
        # Rule 2: Transaction totals match
        results.append(self._validate_transaction_totals(extracted_data))
        
        return [r for r in results if r is not None]
    
    def _validate_bank_balance(self, data: dict[str, Any]) -> Optional[ValidationResult]:
        """Validate: closing = opening + credits - debits."""
        opening = data.get("opening_balance")
        closing = data.get("closing_balance")
        credits = data.get("total_credits")
        debits = data.get("total_debits")
        
        if not all([opening is not None, closing is not None, credits is not None, debits is not None]):
            return None
        
        try:
            opening = Decimal(str(opening))
            closing = Decimal(str(closing))
            credits = Decimal(str(credits))
            debits = Decimal(str(debits))
            
            expected_closing = opening + credits - debits
            difference = abs(expected_closing - closing)
            
            if difference > Decimal("0.01"):
                return ValidationResult(
                    validation_type="BANK_BALANCE_CALCULATION",
                    is_valid=False,
                    expected_value=float(expected_closing),
                    actual_value=float(closing),
                    error_message=f"Balance mismatch. Expected {expected_closing}, got {closing}",
                    severity="ERROR"
                )
            
            return ValidationResult(
                validation_type="BANK_BALANCE_CALCULATION",
                is_valid=True
            )
        except (ValueError, TypeError) as e:
            return ValidationResult(
                validation_type="BANK_BALANCE_CALCULATION",
                is_valid=False,
                error_message=f"Invalid numeric values: {str(e)}",
                severity="ERROR"
            )
    
    def _validate_transaction_totals(self, data: dict[str, Any]) -> Optional[ValidationResult]:
        """Validate: sum of transactions matches totals."""
        transactions = data.get("transactions", [])
        stated_credits = data.get("total_credits")
        stated_debits = data.get("total_debits")
        
        if not transactions or stated_credits is None or stated_debits is None:
            return None
        
        try:
            actual_credits = Decimal("0")
            actual_debits = Decimal("0")
            
            for txn in transactions:
                if isinstance(txn, dict):
                    amount = Decimal(str(txn.get("amount", 0)))
                    txn_type = txn.get("type", "").lower()
                    
                    if txn_type in ["credit", "deposit"]:
                        actual_credits += amount
                    elif txn_type in ["debit", "withdrawal"]:
                        actual_debits += amount
            
            stated_credits = Decimal(str(stated_credits))
            stated_debits = Decimal(str(stated_debits))
            
            credit_diff = abs(actual_credits - stated_credits)
            debit_diff = abs(actual_debits - stated_debits)
            
            if credit_diff > Decimal("0.01") or debit_diff > Decimal("0.01"):
                return ValidationResult(
                    validation_type="TRANSACTION_TOTALS",
                    is_valid=False,
                    error_message=f"Transaction totals mismatch. Credits: {actual_credits} vs {stated_credits}, Debits: {actual_debits} vs {stated_debits}",
                    severity="WARNING"
                )
            
            return ValidationResult(
                validation_type="TRANSACTION_TOTALS",
                is_valid=True
            )
        except (ValueError, TypeError, KeyError) as e:
            return ValidationResult(
                validation_type="TRANSACTION_TOTALS",
                is_valid=False,
                error_message=f"Error validating transactions: {str(e)}",
                severity="WARNING"
            )
