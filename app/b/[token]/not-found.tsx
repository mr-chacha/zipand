import { LinkIcon } from "lucide-react";

export default function BriefingNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <div className="max-w-sm space-y-3 rounded-xl border bg-white p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100">
          <LinkIcon className="size-5 text-neutral-500" />
        </span>
        <h1 className="text-lg font-semibold">브리핑을 찾을 수 없어요</h1>
        <p className="text-sm text-neutral-500">링크가 만료되었거나 삭제되었어요. 담당 중개사에게 새 링크를 요청해 주세요.</p>
      </div>
    </main>
  );
}
