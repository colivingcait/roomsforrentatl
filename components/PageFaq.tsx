import { getFaqs } from "@/lib/faqs";

/** On-page questions. Atlanta keeps these inside the chat only. */
export default function PageFaq() {
  const faqs = getFaqs();
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1080px] px-[18px] py-[30px] md:px-6">
        <h2 className="text-[17px] font-extrabold text-ink">Common questions</h2>
        <div className="mt-3 max-w-[720px] divide-y divide-slate-100">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
                {faq.q}
              </summary>
              <p className="mt-1.5 text-sm text-muted">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
