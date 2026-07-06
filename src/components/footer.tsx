import Link from 'next/link';

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: 'Explore',
    links: [
      ['Browse listings', '/listings'],
      ['Auction calendar', '/calendar'],
      ['Services', '/services'],
      ['Plans', '/plans'],
    ],
  },
  {
    title: 'Services',
    links: [
      ['Property reports', '/services'],
      ['Legal verification', '/services'],
      ['Loan assistance', '/services'],
      ['Talk to an agent', '/services'],
    ],
  },
  {
    title: 'Support',
    links: [
      ['About us', '/about'],
      ['How auctions work', '/about'],
      ['Plans & pricing', '/plans'],
      ['Terms & privacy', '/about'],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0b2135] px-[22px] pb-[30px] pt-12 text-[#c4d6e6]">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[30px] border-b border-[#1c476a] pb-8">
          <div className="max-w-[280px]">
            <div className="mb-3 flex items-center gap-[9px]">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[linear-gradient(150deg,#2f7fd6,#1668c4)] font-extrabold text-white">
                H
              </span>
              <span className="text-lg font-extrabold text-white">Hanshitha Auctions</span>
            </div>
            <p className="mb-4 text-[13px] leading-[1.6] text-[#8fabc4]">
              India&apos;s verified marketplace for bank &amp; tribunal auction properties.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-[#6f97b8]">
                {col.title}
              </div>
              <div className="flex flex-col gap-[9px] text-[13.5px]">
                {col.links.map(([label, href]) => (
                  <Link key={label} href={href} className="transition-colors hover:text-white">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-[18px] gap-y-2 pt-[22px] text-[11.5px] leading-[1.6] text-[#6f8ba3]">
          <span>© 2026 Hanshitha Management Services</span>
          <span>
            Information platform; not legal or investment advice. Subject to lender/tribunal
            processes.
          </span>
        </div>
      </div>
    </footer>
  );
}
