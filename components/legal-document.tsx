export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  effectiveDate: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}

/** 이용약관·개인정보 처리방침 공용 문서 레이아웃 (목차 + 본문) */
export function LegalDocument({ title, effectiveDate, intro, sections }: LegalDocumentProps) {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">시행일: {effectiveDate}</p>
        <div className="text-sm leading-relaxed text-muted-foreground">{intro}</div>
      </header>

      <nav aria-label="목차" className="rounded-xl border bg-card p-4 print:hidden">
        <p className="mb-2 text-sm font-semibold">목차</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-8 rounded-xl border bg-card p-5 sm:p-8">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3">
            <h2 className="text-base font-semibold">{s.title}</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_table]:w-full [&_table]:text-left [&_td]:border [&_td]:p-2 [&_td]:align-top [&_th]:border [&_th]:bg-muted/50 [&_th]:p-2 [&_th]:font-medium [&_th]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
