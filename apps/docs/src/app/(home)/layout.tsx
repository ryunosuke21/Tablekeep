import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <HomeLayout {...baseOptions()} className="tk-page">
      <div className="tk-page-gradient">{children}</div>
    </HomeLayout>
  );
}
