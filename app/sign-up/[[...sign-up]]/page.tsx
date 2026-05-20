import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-earth px-6">
      <SignUp appearance={{ variables: { colorPrimary: "#7A9E7E" } }} />
    </main>
  );
}
