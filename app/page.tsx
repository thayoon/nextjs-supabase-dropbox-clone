import type { Metadata } from "next";
import UI from "./ui";

export const metadata: Metadata = {
  title: "Dropbox clone",
  description: "nextjs supabase dropbox clone",
};

export default function Home() {
  return <UI />;
}
