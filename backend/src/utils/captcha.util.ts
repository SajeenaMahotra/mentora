const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY as string;

export async function verifyCaptcha(token: string): Promise<boolean> {
  const params = new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token });

  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify?${params.toString()}`, {
    method: "POST",
  });

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}