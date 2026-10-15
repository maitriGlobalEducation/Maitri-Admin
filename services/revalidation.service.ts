export async function revalidatePublicpage(): Promise<void> {
  const publicSiteUrl = process.env.PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATION_SECRET;

  if (!publicSiteUrl || !secret) {
    console.error("Missing public-site revalidation configuration");
    return;
  }

  try {
    const response = await fetch(
      `${publicSiteUrl.replace(/\/$/, "")}/api/revalidate`,
      {
        method: "POST",
        headers: {
          "x-revalidation-secret": secret,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("Public-site revalidation failed:", response.status);
    }
  } catch (error) {
    console.error("PUBLIC SITE REVALIDATION ERROR:", error);
  }
}
