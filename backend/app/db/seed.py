from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.document import Document
from app.core.security import hash_password


DEFAULT_PASSWORD = "Passw0rd!"

ROLES = ["developer", "hr", "finance"]

USERS = [
    {
        "full_name": "Iyed Developer",
        "email": "iyed.dev@enterprise.local",
        "role": "developer",
        "is_active": True,
    },
    {
        "full_name": "Sarah HR",
        "email": "sarah.hr@enterprise.local",
        "role": "hr",
        "is_active": True,
    },
    {
        "full_name": "Omar Finance",
        "email": "omar.finance@enterprise.local",
        "role": "finance",
        "is_active": True,
    },
]

DOCUMENTS = [
    # developer
    {"title": "Dev Deployment Guide", "file_name": "Dev_Deployment_Guide.pdf", "owner_role": "developer", "allowed_roles": ["developer"]},
    {"title": "Dev Git Workflow", "file_name": "Dev_Git_Workflow.pdf", "owner_role": "developer", "allowed_roles": ["developer"]},
    {"title": "Dev API Standards", "file_name": "Dev_API_Standards.pdf", "owner_role": "developer", "allowed_roles": ["developer"]},
    {"title": "Dev Secure Coding Checklist", "file_name": "Dev_Secure_Coding_Checklist.pdf", "owner_role": "developer", "allowed_roles": ["developer"]},
    {"title": "Dev Incident Response Runbook", "file_name": "Dev_Incident_Response_Runbook.pdf", "owner_role": "developer", "allowed_roles": ["developer"]},
    {"title": "Dev OnCall Procedure", "file_name": "Dev_OnCall_Procedure.pdf", "owner_role": "developer", "allowed_roles": ["developer"]},

    # hr
    {"title": "HR Recruitment Policy", "file_name": "HR_Recruitment_Policy.pdf", "owner_role": "hr", "allowed_roles": ["hr"]},
    {"title": "HR Leave and Remote Work Policy", "file_name": "HR_Leave_and_Remote_Work_Policy.pdf", "owner_role": "hr", "allowed_roles": ["hr"]},
    {"title": "HR Employee Onboarding", "file_name": "HR_Employee_Onboarding.pdf", "owner_role": "hr", "allowed_roles": ["hr"]},
    {"title": "HR Performance Review Process", "file_name": "HR_Performance_Review_Process.pdf", "owner_role": "hr", "allowed_roles": ["hr"]},
    {"title": "HR Code of Conduct", "file_name": "HR_Code_of_Conduct.pdf", "owner_role": "hr", "allowed_roles": ["hr"]},
    {"title": "HR Offboarding Process", "file_name": "HR_Offboarding_Process.pdf", "owner_role": "hr", "allowed_roles": ["hr"]},

    # finance
    {"title": "Finance Budget Planning Guide", "file_name": "Fin_Budget_Planning_Guide.pdf", "owner_role": "finance", "allowed_roles": ["finance"]},
    {"title": "Finance Expense Reimbursement Policy", "file_name": "Fin_Expense_Reimbursement_Policy.pdf", "owner_role": "finance", "allowed_roles": ["finance"]},
    {"title": "Finance Vendor Payment Process", "file_name": "Fin_Vendor_Payment_Process.pdf", "owner_role": "finance", "allowed_roles": ["finance"]},
    {"title": "Finance Quarterly Reporting Procedure", "file_name": "Fin_Quarterly_Reporting_Procedure.pdf", "owner_role": "finance", "allowed_roles": ["finance"]},
    {"title": "Finance Procurement Policy", "file_name": "Fin_Procurement_Policy.pdf", "owner_role": "finance", "allowed_roles": ["finance"]},
    {"title": "Finance Internal Control Basics", "file_name": "Fin_Internal_Control_Basics.pdf", "owner_role": "finance", "allowed_roles": ["finance"]},
]


def get_or_create_role(db: Session, role_name: str) -> Role:
    role = db.scalar(select(Role).where(Role.name == role_name))
    if role:
        return role
    role = Role(name=role_name)
    db.add(role)
    db.flush()
    return role


def get_or_create_user(db: Session, user_data: dict, role_id: int) -> User:
    user = db.scalar(select(User).where(User.email == user_data["email"]))
    if user:
        return user
    user = User(
        full_name=user_data["full_name"],
        email=user_data["email"],
        password_hash=hash_password(DEFAULT_PASSWORD),
        role_id=role_id,
        is_active=user_data["is_active"],
    )
    db.add(user)
    db.flush()
    return user


def get_or_create_document(db: Session, doc_data: dict) -> Document:
    doc = db.scalar(select(Document).where(Document.file_name == doc_data["file_name"]))
    if doc:
        return doc
    doc = Document(
        title=doc_data["title"],
        file_name=doc_data["file_name"],
        owner_role=doc_data["owner_role"],
        allowed_roles=doc_data["allowed_roles"],
        status="uploaded",
    )
    db.add(doc)
    db.flush()
    return doc


def run_seed() -> None:
    db = SessionLocal()
    try:
        # Roles
        role_map: dict[str, Role] = {}
        for role_name in ROLES:
            role_map[role_name] = get_or_create_role(db, role_name)

        # Users
        for user in USERS:
            role = role_map[user["role"]]
            get_or_create_user(db, user, role.id)

        # Documents
        for doc in DOCUMENTS:
            get_or_create_document(db, doc)

        db.commit()
        print("✅ Seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()