export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  console.log("\n===== EMAIL (stub) =====");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(body);
  console.log("=========================\n");
}