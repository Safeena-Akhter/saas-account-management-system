export function resetPasswordEmailTemplate(name: string, resetUrl: string) {
  return `
    <div style="font-family:Arial;padding:30px">

      <h2>Reset your AccountTrack AMS password</h2>

      <p>Hello <b>${name}</b>,</p>

      <p>
        We received a request to reset your password. Click the button below
        to choose a new one.
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            background:#1976d2;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        This link will expire in <b>1 hour</b>.
      </p>

      <p>
        If you didn't request a password reset, you can safely ignore this
        email - your password will not be changed.
      </p>

    </div>
  `;
}
