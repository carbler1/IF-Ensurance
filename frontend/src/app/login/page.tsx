import Image from "next/image";
import { Data } from "@/components/Data";
import mark from "@/components/mark.png";
import { call } from "@/lib/api";
import { connection } from "next/server";
import { LoginForm } from "./LoginForm";

async function Accounts() {
  await connection();
  const { accounts } = await call<{ accounts: { name: string; claimed: boolean }[] }>("/accounts");
  return <LoginForm accounts={accounts} />;
}

export default function Page() {
  return (
    <div className="mx-auto max-w-md pt-4 md:pt-[10vh]">
      <Image src={mark} alt="If" width={48} height={48} priority className="h-12 w-12" />
      <h1 className="mt-6 text-[2.125rem] leading-tight font-medium">Sign in</h1>
      <p className="mt-2 mb-8 text-[1.0625rem] text-muted-foreground">Pick a company account. An unclaimed account takes the password you enter now.</p>
      <div className="rounded-xl border bg-card p-5 shadow-soft md:p-7">
        <Data load={async () => <Accounts />} />
      </div>
    </div>
  );
}
