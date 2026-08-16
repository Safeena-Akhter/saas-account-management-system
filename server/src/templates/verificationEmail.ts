export function verificationEmailTemplate(
  name: string,
  verificationUrl: string
) {
  return `
    <div style="font-family:Arial;padding:30px">

      <h2>Welcome to AccountTrack AMS</h2>

      <p>Hello <b>${name}</b>,</p>

      <p>
        Thank you for registering your company.
      </p>

      <p>
        Click the button below to verify your email.
      </p>

      <p>
        <a
          href="${verificationUrl}"
          style="
            background:#1976d2;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Verify Email
        </a>
      </p>

      <p>
        This link will expire in <b>24 hours</b>.
      </p>

      <p>
        If you didn't create this account, please ignore this email.
      </p>

    </div>
  `;
}