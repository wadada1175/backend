const transporter = require("./mailer");

async function notifyShiftUpdated(to, name) {
  await transporter.sendMail({
    from: "シフト通知 <noreply@aarth-security.com >",
    to,
    subject: "シフトが確定されました",
    text: `${name} さん\n\n担当シフトが変更されました。\n>> 確認リンク\nhttps://app.example.com/shifts\n\n--\n`,
    html: `<p>${name} さん</p>
         <p>担当シフトが変更されました。</p>
         <p><a href="https://app.example.com/shifts">シフトを確認する</a></p>
         <hr><p>株式会社Example / 東京都…</p>`,
    headers: {
      "List-Unsubscribe": "<mailto:noreply@aarth-security.com",
    },
  });
}

module.exports = notifyShiftUpdated;
