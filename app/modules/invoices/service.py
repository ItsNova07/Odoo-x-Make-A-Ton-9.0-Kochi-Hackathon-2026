from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, selectinload

from app.modules.invoices.models import Invoice
from app.modules.invoices.schemas import (
    InvoiceDetail,
    InvoiceLineOut,
    InvoiceRow,
    InvoiceSummary,
    OverdueInvoice,
    PaymentBrief,
)
from app.modules.money import ZERO, money
from app.modules.payments.models import Payment


class InvoiceRuleError(Exception):
    """A request that breaks an invoice rule, e.g. cancelling a paid invoice."""


# ---------- Shared helpers ----------

def balance_due(invoice: Invoice) -> Decimal:
    return money(Decimal(str(invoice.total)) - Decimal(str(invoice.amount_paid)))


def is_overdue(invoice: Invoice, today: date | None = None) -> bool:
    today = today or date.today()
    return invoice.status == "confirmed" and balance_due(invoice) > 0 and invoice.due_date < today


def overdue_condition(today: date):
    """The same overdue rule as is_overdue, written as a database filter."""
    return and_(
        Invoice.status == "confirmed",
        Invoice.total - Invoice.amount_paid > 0,
        Invoice.due_date < today,
    )


def to_row(invoice: Invoice) -> InvoiceRow:
    return InvoiceRow(
        id=invoice.id,
        number=invoice.number,
        subscription_id=invoice.subscription_id,
        subscription_number=invoice.subscription.subscription_number if invoice.subscription else None,
        customer_name=invoice.customer_name,
        customer_email=invoice.customer_email,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        status=invoice.status,
        subtotal=invoice.subtotal,
        discount_total=invoice.discount_total,
        tax_total=invoice.tax_total,
        total=invoice.total,
        amount_paid=invoice.amount_paid,
        balance_due=balance_due(invoice),
        is_overdue=is_overdue(invoice),
    )


def to_detail(db: Session, invoice: Invoice) -> InvoiceDetail:
    payments = (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice.id)
        .order_by(Payment.payment_date, Payment.id)
        .all()
    )
    return InvoiceDetail(
        **to_row(invoice).model_dump(),
        sent_at=invoice.sent_at,
        lines=[InvoiceLineOut.model_validate(line) for line in invoice.lines],
        payments=[PaymentBrief.model_validate(p) for p in payments],
    )


# ---------- Listing ----------

def list_invoices(
    db: Session,
    *,
    status: str | None,
    customer: str | None,
    subscription_id: int | None,
    from_date: date | None,
    to_date: date | None,
    overdue: bool | None,
    page: int,
    page_size: int,
) -> tuple[list[Invoice], int]:
    query = db.query(Invoice)
    today = date.today()

    if status:
        query = query.filter(Invoice.status == status)
    if customer:
        pattern = f"%{customer.strip()}%"
        query = query.filter(or_(Invoice.customer_name.ilike(pattern), Invoice.customer_email.ilike(pattern)))
    if subscription_id:
        query = query.filter(Invoice.subscription_id == subscription_id)
    if from_date:
        query = query.filter(Invoice.invoice_date >= from_date)
    if to_date:
        query = query.filter(Invoice.invoice_date <= to_date)
    if overdue is True:
        query = query.filter(overdue_condition(today))

    total = query.count()
    items = (
        query.options(selectinload(Invoice.subscription))
        .order_by(Invoice.invoice_date.desc(), Invoice.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


# ---------- Status changes ----------

def confirm(invoice: Invoice) -> None:
    if invoice.status != "draft":
        raise InvoiceRuleError(f"Only draft invoices can be confirmed (this one is {invoice.status})")
    invoice.status = "confirmed"
    if balance_due(invoice) <= 0:
        invoice.status = "paid"  # e.g. a 100% discount: nothing to collect


def cancel(invoice: Invoice) -> None:
    if invoice.status in ("paid", "cancelled"):
        raise InvoiceRuleError(f"A {invoice.status} invoice cannot be cancelled")
    if Decimal(str(invoice.amount_paid)) > 0:
        raise InvoiceRuleError("This invoice has payments recorded, so it cannot be cancelled")
    invoice.status = "cancelled"


def send(invoice: Invoice) -> None:
    if invoice.status == "draft":
        raise InvoiceRuleError("Confirm the invoice before sending it")
    if invoice.status == "cancelled":
        raise InvoiceRuleError("A cancelled invoice cannot be sent")
    invoice.sent_at = datetime.now()


# ---------- Dashboard summary ----------

def summary(db: Session, from_date: date | None, to_date: date | None) -> InvoiceSummary:
    today = date.today()

    revenue_query = db.query(func.coalesce(func.sum(Payment.amount), 0))
    if from_date:
        revenue_query = revenue_query.filter(Payment.payment_date >= from_date)
    if to_date:
        revenue_query = revenue_query.filter(Payment.payment_date <= to_date)
    revenue = revenue_query.scalar()

    outstanding = (
        db.query(func.coalesce(func.sum(Invoice.total - Invoice.amount_paid), 0))
        .filter(Invoice.status == "confirmed")
        .scalar()
    )

    overdue_count, overdue_amount = (
        db.query(func.count(Invoice.id), func.coalesce(func.sum(Invoice.total - Invoice.amount_paid), 0))
        .filter(overdue_condition(today))
        .one()
    )

    oldest = (
        db.query(Invoice)
        .filter(overdue_condition(today))
        .order_by(Invoice.due_date.asc(), Invoice.id.asc())
        .limit(5)
        .all()
    )

    return InvoiceSummary(
        revenue=money(revenue or ZERO),
        outstanding=money(outstanding or ZERO),
        overdue_count=overdue_count,
        overdue_amount=money(overdue_amount or ZERO),
        overdue_invoices=[
            OverdueInvoice(
                id=inv.id,
                number=inv.number,
                customer_name=inv.customer_name,
                due_date=inv.due_date,
                balance_due=balance_due(inv),
            )
            for inv in oldest
        ],
    )
