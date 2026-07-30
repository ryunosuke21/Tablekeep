import { Bento } from "@/components/marketing/bento";
import { Closing } from "@/components/marketing/closing";
import { Hero } from "@/components/marketing/hero";
import { Principles } from "@/components/marketing/principles";
import { Showcase } from "@/components/marketing/showcase";
import { WhereItStands } from "@/components/marketing/where-it-stands";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Principles />
      <Bento />
      <Showcase />
      <WhereItStands />
      <Closing />
    </>
  );
}
