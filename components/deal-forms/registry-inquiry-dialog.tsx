"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Landmark, Loader2, MapPin, Printer } from "lucide-react";
import { toast } from "sonner";
import {
  completeRegistryInquiry,
  discardPendingRegistryFiles,
  registerPropertyFromRegistry,
  startRegistryInquiry,
  type RegistryInquiryResult,
} from "@/lib/actions/codef-registry";
import { openKakaoPostcode, type CodefRoadAddressParts } from "@/lib/kakao-postcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/form/native-select";

export type RegistryPropertyOption = {
  value: string;
  label: string;
  address?: string;
  building?: string;
  unit?: string;
};

type RegistryFileResult = Extract<RegistryInquiryResult, { ok: true; kind: "file" }> & {
  label: string;
};

type UnitInputMode = "both" | "dong" | "ho";

function unitModeFor(dong?: string, ho?: string): UnitInputMode {
  if (dong && !ho) return "dong";
  if (!dong && ho) return "ho";
  return "both";
}

function candidateLabel(candidate: Record<string, unknown>) {
  return String(
    candidate.resAddr ??
      candidate.resUserAddr ??
      candidate.commAddrLotNumber ??
      candidate.uniqueNo ??
      "주소 정보 없음"
  );
}

export function RegistryInquiryDialog({
  open,
  onOpenChange,
  properties,
  allowUnlinked = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: RegistryPropertyOption[];
  allowUnlinked?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [propertyId, setPropertyId] = useState(allowUnlinked ? "" : (properties[0]?.value ?? ""));
  const selectedProperty = useMemo(
    () => properties.find((property) => property.value === propertyId),
    [properties, propertyId]
  );
  const [address, setAddress] = useState<CodefRoadAddressParts | null>(null);
  const [realtyType, setRealtyType] = useState("1");
  const [recordState, setRecordState] = useState("1");
  const [includeLand, setIncludeLand] = useState("0");
  const [dong, setDong] = useState(allowUnlinked ? "" : (properties[0]?.building ?? ""));
  const [ho, setHo] = useState(allowUnlinked ? "" : (properties[0]?.unit ?? ""));
  const [unitMode, setUnitMode] = useState<UnitInputMode>(
    allowUnlinked ? "both" : unitModeFor(properties[0]?.building, properties[0]?.unit)
  );
  const [result, setResult] = useState<RegistryInquiryResult | null>(null);
  const [files, setFiles] = useState<RegistryFileResult[]>([]);
  const requestKind = useRef<"main" | "land">("main");
  const downloadedUrls = useRef(new Set<string>());

  const downloadPdf = async (file: Extract<RegistryInquiryResult, { ok: true; kind: "file" }>) => {
    if (downloadedUrls.current.has(file.downloadUrl)) return;
    downloadedUrls.current.add(file.downloadUrl);
    const anchor = document.createElement("a");
    try {
      const response = await fetch(file.downloadUrl);
      if (!response.ok) throw new Error("PDF 다운로드 실패");
      const objectUrl = URL.createObjectURL(await response.blob());
      anchor.href = objectUrl;
      anchor.download = file.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    } catch {
      anchor.href = file.downloadUrl;
      anchor.download = file.fileName;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  };

  const selectProperty = (nextId: string) => {
    const property = properties.find((item) => item.value === nextId);
    setPropertyId(nextId);
    setDong(property?.building ?? "");
    setHo(property?.unit ?? "");
    setUnitMode(unitModeFor(property?.building, property?.unit));
    setAddress(null);
    setResult(null);
    setFiles([]);
  };

  const pickAddress = async () => {
    try {
      const picked = await openKakaoPostcode();
      if (!picked) return;
      if (!picked.addrSido || !picked.addrSigungu || !picked.addrRoadName || !picked.addrBuildingNumber) {
        toast.error("도로명 주소 정보를 모두 확인할 수 없어요. 다른 주소로 다시 검색해 주세요.");
        return;
      }
      setAddress(picked);
      if (picked.apartment) setRealtyType("1");
      setResult(null);
      setFiles([]);
      toast.success("등기 검색 주소를 선택했어요.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "주소 검색에 실패했어요.");
    }
  };

  const applyRequestKind = (fd: FormData) => {
    if (requestKind.current !== "land") return;
    fd.set("realty_type", "2");
    fd.set("dong", "");
    fd.set("ho", "");
    fd.set("registry_label", "토지");
  };

  const handleResult = async (next: RegistryInquiryResult): Promise<void> => {
    setResult(next);
    if (!next.ok) {
      toast.error(next.error);
      return;
    }
    if (next.kind === "choose_address") {
      toast.info(next.message);
      return;
    }
    if (next.message) toast.success(next.message);
    const label = requestKind.current === "land" ? "토지 등기" : "등기";
    setFiles((current) =>
      current.some((file) => file.downloadUrl === next.downloadUrl)
        ? current
        : [...current, { ...next, label }]
    );
    void downloadPdf(next);

    if (requestKind.current === "main" && includeLand === "1" && realtyType !== "2" && formRef.current) {
      requestKind.current = "land";
      const landFd = new FormData(formRef.current);
      applyRequestKind(landFd);
      setResult(null);
      await handleResult(await startRegistryInquiry(null, landFd));
    }
  };

  const submitFirst = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    requestKind.current = "main";
    setResult(null);
    setFiles([]);
    downloadedUrls.current.clear();
    startTransition(async () => await handleResult(await startRegistryInquiry(null, fd)));
  };

  const submitCandidate = (uniqueNo: string) => {
    if (!formRef.current || !result?.ok || result.kind !== "choose_address") return;
    const fd = new FormData(formRef.current);
    applyRequestKind(fd);
    fd.set("unique_no", uniqueNo);
    fd.set("job_index", String(result.twoWay.jobIndex));
    fd.set("thread_index", String(result.twoWay.threadIndex));
    fd.set("jti", result.twoWay.jti);
    fd.set("two_way_timestamp", String(result.twoWay.twoWayTimestamp));
    if (result.twoWay.method) fd.set("method", result.twoWay.method);
    startTransition(async () => await handleResult(await completeRegistryInquiry(null, fd)));
  };

  const registerProperty = () => {
    if (!address) return;
    const pendingFiles = files.filter((file) => file.pendingStoragePath);
    if (!pendingFiles.length) return;
    const fd = new FormData();
    fd.set("property_address", address.roadAddress);
    fd.set("property_region", address.addrSigungu);
    fd.set("dong", dong);
    fd.set("ho", ho);
    fd.set("is_apartment", address.apartment ? "1" : "0");
    pendingFiles.forEach((file) => {
      fd.append("pending_path", file.pendingStoragePath!);
      fd.append("pending_file_name", file.fileName);
    });
    startTransition(async () => {
      const registered = await registerPropertyFromRegistry(fd);
      if (!registered.ok) {
        toast.error(registered.error);
        return;
      }
      setFiles([]);
      toast.success(registered.message);
      router.push(`/properties/${registered.propertyId}?tab=docs`);
    });
  };

  const changeOpen = (next: boolean) => {
    if (pending) return;
    if (!next) {
      const pendingPaths = files
        .map((file) => file.pendingStoragePath)
        .filter((path): path is string => Boolean(path));
      if (pendingPaths.length) void discardPendingRegistryFiles(pendingPaths);
      if (files.length > 0) router.refresh();
      setAddress(null);
      setResult(null);
      setFiles([]);
      setPropertyId(allowUnlinked ? "" : (properties[0]?.value ?? ""));
      setDong(allowUnlinked ? "" : (properties[0]?.building ?? ""));
      setHo(allowUnlinked ? "" : (properties[0]?.unit ?? ""));
      setUnitMode(
        allowUnlinked ? "both" : unitModeFor(properties[0]?.building, properties[0]?.unit)
      );
      setRecordState("1");
      setIncludeLand("0");
      requestKind.current = "main";
      downloadedUrls.current.clear();
    }
    onOpenChange(next);
  };

  const showCompletedFiles =
    files.length > 0 && result !== null && (!result.ok || result.kind === "file");
  const unitInputMissing =
    realtyType === "1" &&
    ((unitMode === "both" && (!dong.trim() || !ho.trim())) ||
      (unitMode === "dong" && !dong.trim()) ||
      (unitMode === "ho" && !ho.trim()));

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>등기사항증명서 PDF 열람</DialogTitle>
          <DialogDescription>
         해당 주소의 등기부등본 PDF를 매물관리의 서류탭에 저장했습니다.
          </DialogDescription>
        </DialogHeader>

        {properties.length === 0 && !allowUnlinked ? (
          <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            먼저{" "}
            <Link href="/properties/new" className="underline underline-offset-2">
              매물을 등록
            </Link>
            한 뒤 등기를 연결해 주세요.
          </p>
        ) : (
          <form ref={formRef} onSubmit={submitFirst} className="space-y-4">
            <div className={showCompletedFiles ? "hidden" : "space-y-4"}>
              <input type="hidden" name="property_id" value={propertyId} />
              <input type="hidden" name="addr_sido" value={address?.addrSido ?? ""} />
              <input type="hidden" name="addr_sigungu" value={address?.addrSigungu ?? ""} />
              <input type="hidden" name="addr_road_name" value={address?.addrRoadName ?? ""} />
              <input type="hidden" name="addr_building_number" value={address?.addrBuildingNumber ?? ""} />

            <div className="space-y-1.5">
              <Label htmlFor="reg-property">저장할 매물</Label>
              <NativeSelect
                id="reg-property"
                value={propertyId}
                onChange={(event) => selectProperty(event.target.value)}
                options={[
                  ...(allowUnlinked ? [{ value: "", label: "선택 안 함" }] : []),
                  ...properties.map((property) => ({ value: property.value, label: property.label })),
                ]}
                className="w-full"
              />
              {!propertyId && (
                <p className="text-xs text-muted-foreground">
                  매물을 선택하지 않아도 PDF는 자동 다운로드됩니다. 열람 후 이 주소로 새 매물을 등록할 수 있어요.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>부동산 구분</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { value: "0", label: "토지 + 건물" },
                  { value: "1", label: "집합건물" },
                  { value: "2", label: "토지" },
                  { value: "3", label: "건물" },
                ].map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="realty_type"
                      value={option.value}
                      checked={realtyType === option.value}
                      onChange={() => {
                        setRealtyType(option.value);
                        if (option.value === "2") setIncludeLand("0");
                        setResult(null);
                        setFiles([]);
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex h-9 items-center justify-center rounded-lg border px-2 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>등기 검색 주소</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={address?.roadAddress ?? ""}
                  placeholder={selectedProperty?.address || "주소 검색으로 도로명 주소를 선택하세요"}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={pickAddress} disabled={pending}>
                  <MapPin data-icon="inline-start" />
                  주소 검색
                </Button>
              </div>
              {address && (
                <p className="text-xs text-muted-foreground">
                  {address.addrSido} · {address.addrSigungu} · {address.addrRoadName}{" "}
                  {address.addrBuildingNumber}
                </p>
              )}
            </div>

            {realtyType === "1" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Label>동·호 선택</Label>
                  {[
                    { value: "both", label: "동+호" },
                    { value: "dong", label: "동" },
                    { value: "ho", label: "호" },
                  ].map((option) => (
                    <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="unit_mode"
                        value={option.value}
                        checked={unitMode === option.value}
                        onChange={() => {
                          const nextMode = option.value as UnitInputMode;
                          setUnitMode(nextMode);
                          if (nextMode === "dong") setHo("");
                          if (nextMode === "ho") setDong("");
                          setResult(null);
                          setFiles([]);
                        }}
                        className="size-4 accent-primary"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-dong">동</Label>
                    <Input
                      id="reg-dong"
                      name="dong"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required={unitMode !== "ho"}
                      disabled={unitMode === "ho"}
                      value={dong}
                      onChange={(event) => {
                        setDong(event.target.value.replace(/\D/g, ""));
                        setResult(null);
                      }}
                      placeholder="예) 101"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-ho">호</Label>
                    <Input
                      id="reg-ho"
                      name="ho"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required={unitMode !== "dong"}
                      disabled={unitMode === "dong"}
                      value={ho}
                      onChange={(event) => {
                        setHo(event.target.value.replace(/\D/g, ""));
                        setResult(null);
                      }}
                      placeholder="예) 1203"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="reg-record-state">등기기록 유형</Label>
                <NativeSelect
                  id="reg-record-state"
                  name="record_state"
                  value={recordState}
                  onChange={(event) => {
                    setRecordState(event.target.value);
                    setResult(null);
                    setFiles([]);
                  }}
                  options={[
                    { value: "1", label: "현재 유효사항" },
                    { value: "0", label: "말소사항 포함" },
                  ]}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-include-land">같은 지번 토지등기</Label>
                <NativeSelect
                  id="reg-include-land"
                  value={includeLand}
                  disabled={realtyType === "2"}
                  onChange={(event) => {
                    setIncludeLand(event.target.value);
                    setResult(null);
                    setFiles([]);
                  }}
                  options={[
                    { value: "0", label: "미열람" },
                    { value: "1", label: "함께 열람" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
              열람을 실행하면 등기 열람수수료가 차감됩니다.
              {includeLand === "1" && realtyType !== "2" && " 토지등기를 함께 열람하면 2건의 수수료가 발생할 수 있습니다."}
            </p>

            {result && !result.ok && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{result.error}</p>
            )}

            {result?.ok && result.kind === "choose_address" && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-medium">{result.message}</p>
                <div className="grid max-h-52 gap-2 overflow-y-auto">
                  {result.candidates.map((candidate) => (
                    <Button
                      key={candidate.uniqueNo}
                      type="button"
                      variant="outline"
                      className="h-auto justify-start whitespace-normal py-2 text-left"
                      disabled={pending}
                      onClick={() => submitCandidate(candidate.uniqueNo)}
                    >
                      <span>
                        {candidateLabel(candidate)}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          고유번호 {candidate.uniqueNo}
                        </span>
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

              {!(result?.ok && result.kind === "choose_address") && (
                <DialogFooter className="mt-1">
                  <Button
                    type="submit"
                    disabled={pending || !address || unitInputMissing}
                  >
                    {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Landmark data-icon="inline-start" />}
                    {pending ? "인터넷등기소 열람 중…" : "등기 열람"}
                  </Button>
                </DialogFooter>
              )}
            </div>

            {showCompletedFiles && result && (
              <div className="space-y-2 rounded-md border border-success/30 bg-success/10 p-3">
                {!result.ok && <p className="text-sm text-destructive">토지등기 열람 실패: {result.error}</p>}
                {result.ok && result.message && <p className="text-sm text-success">{result.message}</p>}
                {files.map((file) => (
                  <Button
                    key={file.downloadUrl}
                    type="button"
                    className="w-full"
                    onClick={() => window.open(file.downloadUrl, "_blank", "noopener,noreferrer")}
                  >
                    <Printer data-icon="inline-start" />
                    {files.length > 1 ? `${file.label} 인쇄` : "등기 인쇄"}
                  </Button>
                ))}
                {!propertyId && files.some((file) => file.pendingStoragePath) && (
                  <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={registerProperty}>
                    {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Building2 data-icon="inline-start" />}
                    해당 주소의 매물 등록
                  </Button>
                )}
              </div>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function RegistryInquiryButton({
  properties,
  allowUnlinked = false,
}: {
  properties: RegistryPropertyOption[];
  allowUnlinked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Landmark data-icon="inline-start" />
        등기 열람
      </Button>
      <RegistryInquiryDialog
        open={open}
        onOpenChange={setOpen}
        properties={properties}
        allowUnlinked={allowUnlinked}
      />
    </>
  );
}
