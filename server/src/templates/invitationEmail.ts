const ROLE_LABEL: Record<string, string> = {
  BUSINESS_OWNER: "Business Owner",
  MANAGER: "Manager",
  ACCOUNTANT: "Accountant",
  EMPLOYEE: "Employee"
};

export function invitationEmailTemplate(name: string, companyName: string, role: string, invitationUrl: string) {
  const roleLabel = ROLE_LABEL[role] ?? role;

  return `
    <div style="font-family:Arial;padding:30px">

      <h2>You've been invited to join ${companyName} on AccountTrack AMS</h2>

      <p>Hello <b>${name}</b>,</p>

      <p>
        You've been added to <b>${companyName}</b> as a
        <b>${roleLabel}</b>. To get started, set up your password by
        clicking the button below.
      </p>

      <p>
        <a
          href="${invitationUrl}"
          style="
            background:#1976d2;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Accept Invitation
        </a>
      </p>

      <p>
        This invitation link will expire in <b>24 hours</b>. If it expires,
        ask your Business Owner to resend the invitation.
      </p>

      <p>
        If you weren't expecting this invitation, you can safely ignore this
        email.
      </p>

    </div>
  `;
}
