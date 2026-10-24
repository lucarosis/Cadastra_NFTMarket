import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <RegisterForm next={typeof next === "string" ? next : null} />;
}
