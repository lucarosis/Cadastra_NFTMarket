import { LoginForm } from "@/components/LoginForm";

/* `next` is where a members-only page sent the visitor from; LoginForm checks it with
   safeNext before following it. `registered` means they have just created an account. */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const { next, registered } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : null} registered={registered === "1"} />;
}
