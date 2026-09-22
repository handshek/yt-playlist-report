import Footer from "@/components/Footer";
import HeaderNav from "@/components/HeaderNav";

interface PolicyPageProps {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}

const PolicyPage = ({ eyebrow, title, updated, children }: PolicyPageProps) => (
  <>
    <HeaderNav />
    <main className="container mx-auto max-w-3xl py-16 md:py-24">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950 md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-neutral-500">Last updated {updated}</p>
      <div className="mt-10 space-y-8 text-base leading-7 text-neutral-700 [&_a]:font-semibold [&_a]:text-red-700 [&_a]:underline [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-neutral-950 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </main>
    <Footer />
  </>
);

export default PolicyPage;
