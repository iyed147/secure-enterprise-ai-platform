# RBAC Matrix (Initial)

## Roles
- developer
- hr
- finance

## Access Rule
A user can query only chunks/documents where `allowed_roles` contains their role.

## Initial Document Scopes

### developer
- Dev_Deployment_Guide.pdf
- Dev_Git_Workflow.pdf
- Dev_API_Standards.pdf
- Dev_Secure_Coding_Checklist.pdf
- Dev_Incident_Response_Runbook.pdf
- Dev_OnCall_Procedure.pdf

### hr
- HR_Recruitment_Policy.pdf
- HR_Leave_and_Remote_Work_Policy.pdf
- HR_Employee_Onboarding.pdf
- HR_Performance_Review_Process.pdf
- HR_Code_of_Conduct.pdf
- HR_Offboarding_Process.pdf

### finance
- Fin_Budget_Planning_Guide.pdf
- Fin_Expense_Reimbursement_Policy.pdf
- Fin_Vendor_Payment_Process.pdf
- Fin_Quarterly_Reporting_Procedure.pdf
- Fin_Procurement_Policy.pdf
- Fin_Internal_Control_Basics.pdf

## Security Constraint
Filtering by role must happen BEFORE retrieval result is sent to LLM.