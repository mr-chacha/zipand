"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTask, deleteTask, toggleTask } from "@/lib/actions/tasks";
import { TASK_TYPES } from "@/lib/constants";
import { formatDateTime, formatTime, isoToKstLocal } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";

export interface TaskItem {
  id: string;
  title: string;
  type: string;
  due_at: string;
  done: boolean;
  property: { id: string; title: string } | null;
  customer: { id: string; name: string } | null;
  assignee: { name: string } | null;
}

type Option = { value: string; label: string };

interface TaskBoardProps {
  tasks: TaskItem[];
  /** 오늘 시작·내일 시작 시각 (ISO). 서버 기준으로 계산해 전달한다. */
  todayStart: string;
  tomorrowStart: string;
  members: Option[];
  properties?: Option[];
  customers?: Option[];
  fixedCustomerId?: string;
  emptyText?: string;
}

export function TaskBoard({
  tasks,
  todayStart,
  tomorrowStart,
  members,
  properties = [],
  customers = [],
  fixedCustomerId,
  emptyText = "등록된 할 일이 없어요.",
}: TaskBoardProps) {
  const [pending, startTransition] = useTransition();

  const groups = [
    { key: "overdue", label: "지연", items: tasks.filter((t) => !t.done && t.due_at < todayStart) },
    { key: "today", label: "오늘", items: tasks.filter((t) => !t.done && t.due_at >= todayStart && t.due_at < tomorrowStart) },
    { key: "upcoming", label: "예정", items: tasks.filter((t) => !t.done && t.due_at >= tomorrowStart) },
    { key: "done", label: "완료", items: tasks.filter((t) => t.done) },
  ].filter((g) => g.items.length > 0);

  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
    });

  return (
    <div className="space-y-4">
      <TaskDialog
        members={members}
        properties={properties}
        customers={customers}
        fixedCustomerId={fixedCustomerId}
      />
      {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>}
      {groups.map((group) => (
        <div key={group.key} className="space-y-1">
          <p className={cn("text-xs font-medium", group.key === "overdue" ? "text-destructive" : "text-muted-foreground")}>
            {group.label} {group.items.length}
          </p>
          {group.items.map((task) => (
            <div key={task.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
              <Checkbox
                checked={task.done}
                disabled={pending}
                onCheckedChange={(v) => run(() => toggleTask(task.id, Boolean(v)))}
                aria-label="완료"
              />
              <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
                {group.key === "today" ? formatTime(task.due_at) : formatDateTime(task.due_at)}
              </span>
              <Badge variant="outline" className="hidden w-12 justify-center sm:inline-flex">
                {task.type}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", task.done && "text-muted-foreground line-through")}>{task.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[
                    task.property && (
                      <Link key="p" href={`/properties/${task.property.id}`} className="hover:underline">
                        {task.property.title}
                      </Link>
                    ),
                    !fixedCustomerId && task.customer && (
                      <Link key="c" href={`/customers/${task.customer.id}`} className="hover:underline">
                        {task.customer.name}
                      </Link>
                    ),
                    task.assignee && <span key="a">담당 {task.assignee.name}</span>,
                  ]
                    .filter(Boolean)
                    .flatMap((node, i) => (i === 0 ? [node] : [" · ", node]))}
                </p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="삭제"
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                disabled={pending}
                onClick={() => run(() => deleteTask(task.id))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TaskDialog({
  members,
  properties,
  customers,
  fixedCustomerId,
}: {
  members: Option[];
  properties: Option[];
  customers: Option[];
  fixedCustomerId?: string;
}) {
  const [open, setOpen] = useState(false);
  const { state, pending, onSubmit, setState } = useFormAction(createTask, {
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
          <Button variant="outline" size="sm" className="w-full">
            <Plus data-icon="inline-start" />
            할 일 추가
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>할 일 추가</DialogTitle>
          <DialogDescription>임장, 연락, 서류 확인 같은 후속 일정을 기록해요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">할 일</Label>
            <Input id="task-title" name="title" placeholder="예: 임대인에게 수리 일정 확인" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-type">종류</Label>
              <NativeSelect id="task-type" name="type" options={TASK_TYPES} defaultValue={fixedCustomerId ? "연락" : "기타"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">일시</Label>
              <Input id="task-due" name="due_at" type="datetime-local" defaultValue={isoToKstLocal(null)} required />
            </div>
          </div>
          {properties.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-property">관련 매물</Label>
              <NativeSelect id="task-property" name="property_id" options={properties} placeholder="선택 안 함" />
            </div>
          )}
          {fixedCustomerId ? (
            <input type="hidden" name="customer_id" value={fixedCustomerId} />
          ) : (
            customers.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="task-customer">관련 고객</Label>
                <NativeSelect id="task-customer" name="customer_id" options={customers} placeholder="선택 안 함" />
              </div>
            )
          )}
          {members.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">담당자</Label>
              <NativeSelect id="task-assignee" name="assignee_id" options={members} placeholder="나" />
            </div>
          )}
          <FormMessage state={state} />
          <div className="flex justify-end">
            <SubmitButton pending={pending}>추가</SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
