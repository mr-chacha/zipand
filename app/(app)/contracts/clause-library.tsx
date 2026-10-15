"use client";

import { useMemo, useState } from "react";
import { Copy, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { FormActions } from "@/components/form/form-actions";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOfficeClause, deleteOfficeClause } from "@/lib/actions/deals";
import { CLAUSE_CATEGORIES, CLAUSE_LIBRARY } from "@/lib/clauses";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";

interface OfficeClauseItem {
  id: string;
  category: string;
  title: string;
  body: string;
}

interface ClauseLibraryProps {
  officeClauses: OfficeClauseItem[];
  /** 지정하면 '추가' 버튼으로 거래에 특약을 넣는다. 없으면 복사 버튼을 보여준다. */
  onPick?: (body: string) => void;
  pickDisabled?: boolean;
}

export function ClauseLibrary({ officeClauses, onPick, pickDisabled }: ClauseLibraryProps) {
  const [category, setCategory] = useState("사무소 특약");
  const categories = ["사무소 특약", ...CLAUSE_CATEGORIES];

  const items = useMemo(() => {
    if (category === "사무소 특약") {
      return officeClauses.map((c) => ({ ...c, office: true as const }));
    }
    return CLAUSE_LIBRARY.filter((c) => c.category === category).map((c) => ({ ...c, office: false as const }));
  }, [category, officeClauses]);

  const copy = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success("특약 문구를 복사했어요.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {c}
            {c === "사무소 특약" && ` (${officeClauses.length})`}
          </button>
        ))}
      </div>

      {category === "사무소 특약" && <OfficeClauseDialog />}

      {items.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          자주 쓰는 특약을 저장해 두면 사무소 구성원 모두가 사용할 수 있어요.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.office && <Badge variant="secondary">{item.category}</Badge>}
                  {!item.office && item.expertReview && (
                    <Badge className="border-0 bg-destructive/10 text-destructive">
                      <ShieldAlert data-icon="inline-start" />
                      전문가 검토 권장
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{item.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {onPick ? (
                  <Button size="sm" variant="outline" disabled={pickDisabled} onClick={() => onPick(item.body)}>
                    <Plus data-icon="inline-start" />
                    추가
                  </Button>
                ) : (
                  <Button size="icon-sm" variant="ghost" aria-label="복사" onClick={() => copy(item.body)}>
                    <Copy />
                  </Button>
                )}
                {item.office && !onPick && (
                  <ConfirmAction
                    action={() => deleteOfficeClause(item.id)}
                    title="사무소 특약을 삭제할까요?"
                    successMessage="삭제했어요."
                    trigger={
                      <Button size="icon-sm" variant="ghost" aria-label="삭제">
                        <Trash2 />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
            {!item.office && (
              <dl className="grid gap-1 rounded-md bg-muted/50 p-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-medium">적용 전제</dt>
                  <dd className="text-muted-foreground">{item.premise}</dd>
                </div>
                <div>
                  <dt className="font-medium">분쟁 소지</dt>
                  <dd className="text-muted-foreground">{item.risk}</dd>
                </div>
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OfficeClauseDialog() {
  const [open, setOpen] = useState(false);
  const { state, pending, onSubmit, setState } = useFormAction(createOfficeClause, {
    onSuccess: (result) => {
      toast.success(result.message);
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setState(null);
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus data-icon="inline-start" />
            사무소 특약 저장
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>사무소 특약 저장</DialogTitle>
          <DialogDescription>사무소 구성원 모두가 이 문구를 사용할 수 있어요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="clause-category">분류</Label>
              <Input id="clause-category" name="category" list="clause-categories" placeholder="기타" />
              <datalist id="clause-categories">
                {CLAUSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="clause-title">제목</Label>
              <Input id="clause-title" name="title" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clause-body">특약 문구</Label>
            <Textarea id="clause-body" name="body" rows={5} required />
          </div>
          <FormMessage state={state} />
          <FormActions>
            <SubmitButton pending={pending}>저장</SubmitButton>
          </FormActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
