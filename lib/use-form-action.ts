"use client";

import { useState, useTransition } from "react";
import { BUSY_LABELS, useBusy } from "@/lib/busy";
import { toErrorMessage } from "@/lib/errors";
import type { ActionState } from "@/types";

type FormActionFn = (prev: ActionState | null, fd: FormData) => Promise<ActionState | void>;

/**
 * 서버 액션을 onSubmit으로 실행한다.
 * `<form action>`은 실패해도 입력값을 초기화하므로, 검증 오류 시 입력을 유지하려고 사용한다.
 */
export function useFormAction(
  action: FormActionFn,
  options: {
    initialState?: ActionState | null;
    onSuccess?: (state: ActionState, form: HTMLFormElement) => void;
    /** 액션 전에 실행 (파일 업로드 등). FormData에 값을 추가할 수 있고, 던지면 오류로 표시한다. */
    prepare?: (fd: FormData) => Promise<void>;
    /** 앱에서 진행 중 전체 화면에 보일 문구 */
    busyLabel?: string;
  } = {}
) {
  const [state, setState] = useState<ActionState | null>(options.initialState ?? null);
  const [pending, startTransition] = useTransition();
  useBusy(pending, options.busyLabel ?? BUSY_LABELS.save);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    // 누른 submit 버튼의 name/value(예: intent=next)도 함께 보낸다
    const fd = new FormData(form, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(async () => {
      if (options.prepare) {
        try {
          await options.prepare(fd);
        } catch (error) {
          setState({ error: toErrorMessage(error) });
          return;
        }
      }
      const result = (await action(state, fd)) ?? null;
      setState(result);
      if (result && !result.error) options.onSuccess?.(result, form);
    });
  };

  return { state, pending, onSubmit, setState };
}
