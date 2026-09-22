import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";

const Cta = ({ onCtaClick }: { onCtaClick: () => void }) => {
  return (
    <section className="bg-red-100 rounded-md py-16 my-20 border border-red-300 shadow-md">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs md:text-sm uppercase tracking-wide text-red-600 mb-2">
          it's free real estate
        </p>
        <h2 className="text-2xl md:text-4xl font-black tracking-tight text-gray-900 mb-2">
          Playlist reports stay free. No sign-up required.
        </h2>
        <p className="text-md md:text-lg text-gray-600 mb-8">
          Generate a comprehensive report of any YouTube playlist in seconds.
        </p>
        <Button
          size="lg"
          className="py-6 md:py-6 md:px-8 md:text-base lg:w-fit bg-red-600 hover:bg-red-800 transition-colors"
          onClick={onCtaClick}
        >
          <ScrollText className="mr-2 h-4 w-4 md:h-4 md:w-5" />
          Generate Report
        </Button>
      </div>
    </section>
  );
};

export default Cta;
