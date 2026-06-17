import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { ChatApp } from "@/components/chat-app";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  return <ChatApp userEmail={session.user.email} userName={session.user.name} />;
}
