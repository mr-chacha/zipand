"use client";

import { useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { NativeSelect } from "@/components/form/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LAND_CATEGORIES } from "@/lib/contract-templates";
import { cn } from "@/lib/utils";

export type DisclosurePageNo = 1 | 2 | 3 | 4;

export const DISCLOSURE_PAGES: { no: DisclosurePageNo; label: string }[] = [
  { no: 1, label: "1페이지" },
  { no: 2, label: "2페이지" },
  { no: 3, label: "3페이지" },
  { no: 4, label: "4페이지" },
];

/** 확인설명서 페이지 전환 탭 — 스크롤 영역 밖에 두는 것을 권장 */
export function DisclosurePageTabs({
  page,
  onPageChange,
  className,
  pageCount = 4,
}: {
  page: DisclosurePageNo;
  onPageChange: (page: DisclosurePageNo) => void;
  className?: string;
  pageCount?: 3 | 4;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1 bg-muted px-4 py-2 print:hidden", className)}>
      {DISCLOSURE_PAGES.filter((p) => p.no <= pageCount).map((p) => (
        <button
          key={p.no}
          type="button"
          onClick={() => onPageChange(p.no)}
          className={cn(
            "min-w-[4.5rem] rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            page === p.no
              ? "bg-foreground text-background"
              : "bg-background text-foreground hover:bg-background/80"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

const fieldBorder =
  "rounded-none border border-foreground/40 bg-background shadow-none focus-visible:border-foreground/70 focus-visible:ring-0";

function Cell({
  name,
  data,
  className,
  ...props
}: { name: string; data: Record<string, string> } & React.ComponentProps<typeof Input>) {
  return (
    <Input
      name={name}
      defaultValue={data[name] ?? ""}
      className={cn("h-7 bg-background px-1.5 text-[12px]", fieldBorder, className)}
      {...props}
    />
  );
}

function Area({
  name,
  data,
  rows = 2,
  className,
}: {
  name: string;
  data: Record<string, string>;
  rows?: number;
  className?: string;
}) {
  return (
    <Textarea
      name={name}
      rows={rows}
      defaultValue={data[name] ?? ""}
      className={cn("min-h-0 resize-y bg-background text-[12px]", fieldBorder, className)}
    />
  );
}

/** 다중 선택 근거자료 — 값 "1"이면 체크 */
function DocCheck({
  name,
  data,
  label,
}: {
  name: string;
  data: Record<string, string>;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1 whitespace-nowrap text-[11px]">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={(data[name] ?? "") === "1"}
        className="size-3.5 accent-foreground"
      />
      {label}
    </label>
  );
}

/** 배타 선택(라디오) */
function Opt({
  name,
  value,
  data,
  label,
}: {
  name: string;
  value: string;
  data: Record<string, string>;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1 whitespace-nowrap text-[11px]">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={(data[name] ?? "") === value}
        className="size-3.5 accent-foreground"
      />
      {label}
    </label>
  );
}

function Th({
  children,
  className,
  colSpan,
  rowSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={cn(
        "border border-foreground/50 bg-muted/40 px-1.5 py-1 text-center text-[11px] font-semibold leading-snug",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className, colSpan, rowSpan }: { children?: React.ReactNode; className?: string; colSpan?: number; rowSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={cn("border border-foreground/50 px-1.5 py-1 align-middle text-[11px] leading-snug", className)}
    >
      {children}
    </td>
  );
}

function Page({
  no,
  active,
  children,
  className,
  lastPage = false,
}: {
  no: DisclosurePageNo;
  active: boolean;
  children: React.ReactNode;
  className?: string;
  lastPage?: boolean;
}) {
  return (
    <section
      className={cn(
        "disclosure-page space-y-2 border border-foreground/30 bg-white p-3 print:break-after-page print:border-0 print:p-0",
        (no === 4 || lastPage) && "print:break-after-auto",
        active ? "block" : "hidden print:block",
        className
      )}
    >
      <p className="text-right text-[11px] text-muted-foreground print:text-foreground">(제{no}쪽)</p>
      {children}
    </section>
  );
}

function PartyBlock({
  roleLabel,
  prefix,
  data,
}: {
  roleLabel: string;
  prefix: "lessor" | "lessee";
  data: Record<string, string>;
}) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        <tr>
          <Th rowSpan={4} className="w-16 whitespace-pre-wrap">
            {roleLabel}
          </Th>
          <Th className="w-16">주소</Th>
          <Td colSpan={3}>
            <Cell name={`${prefix}_address`} data={data} />
          </Td>
          <Td rowSpan={4} className="w-24 text-center text-muted-foreground">
            (서명 또는 인)
          </Td>
        </tr>
        <tr>
          <Th>성명</Th>
          <Td>
            <Cell name={`${prefix}_name`} data={data} />
          </Td>
          <Th className="w-16">생년월일</Th>
          <Td>
            <Cell name={`${prefix}_birth`} data={data} placeholder="YYYY-MM-DD" />
          </Td>
        </tr>
        <tr>
          <Th>전화번호</Th>
          <Td colSpan={3}>
            <Cell name={`${prefix}_phone`} data={data} />
          </Td>
        </tr>
        <tr>
          <Th>주민번호</Th>
          <Td colSpan={3}>
            <div className="flex items-center gap-1">
              <Cell name={`${prefix}_id_front`} data={data} className="w-24" inputMode="numeric" />
              <span>-</span>
              <Cell name={`${prefix}_id_back`} data={data} className="w-28" inputMode="numeric" />
            </div>
          </Td>
        </tr>
      </tbody>
    </table>
  );
}

function OfficeBlock({
  prefix,
  data,
  label,
}: {
  prefix: "" | "joint_";
  data: Record<string, string>;
  label: string;
}) {
  const n = (key: string) => `${prefix}${key}`;
  return (
    <table className="w-full border-collapse">
      <tbody>
        <tr>
          <Th rowSpan={4} className="w-20 whitespace-pre-wrap">
            {label}
          </Th>
          <Th className="w-20">등록번호</Th>
          <Td>
            <Cell name={n("office_registration_no")} data={data} />
          </Td>
          <Th className="w-20">전화번호</Th>
          <Td>
            <Cell name={n("office_phone")} data={data} />
          </Td>
          <Td rowSpan={4} className="w-24 text-center text-muted-foreground">
            (서명 또는 인)
          </Td>
        </tr>
        <tr>
          <Th>사무소 명칭</Th>
          <Td colSpan={3}>
            <Cell name={n("office_name")} data={data} />
          </Td>
        </tr>
        <tr>
          <Th>사무소 소재지</Th>
          <Td colSpan={3}>
            <Cell name={n("office_address")} data={data} />
          </Td>
        </tr>
        <tr>
          <Th>성명(대표자)</Th>
          <Td>
            <Cell name={n("office_representative")} data={data} />
          </Td>
          <Th>소속공인중개사</Th>
          <Td>
            <Cell name={n("agent_name")} data={data} />
          </Td>
        </tr>
      </tbody>
    </table>
  );
}

function formatWon(v: string | undefined) {
  const n = Number(String(v ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "0";
  return n.toLocaleString("ko-KR");
}

/** 비주거용 건축물 확인·설명서 — 3쪽 서식 */
export function NonResidentialDisclosureFormSheet({
  title,
  data,
  page,
}: {
  title: string;
  data: Record<string, string>;
  page: DisclosurePageNo;
}) {
  const field = (name: string, label: string, className = "") => (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <span className="shrink-0 font-medium">{label}</span>
      <Cell name={name} data={data} className="min-w-0 flex-1" />
    </div>
  );
  const check = (name: string, label: string) => (
    <DocCheck name={name} data={data} label={label} />
  );

  return (
    <div id="disclosure-print-root" className="space-y-4 bg-white text-[12px] text-foreground print:space-y-0 print:text-[10.5px]">
      <input type="hidden" name="template_title" value={title} />
      <input type="hidden" name="form_template" value="disclosure_nonresidential_v1" />
      <input type="hidden" name="disclosure_building_type" value="nonresidential" />
      <input type="hidden" name="property_title" defaultValue={data.property_title ?? ""} />
      <input type="hidden" name="property_type" defaultValue={data.property_type ?? ""} />
      <input type="hidden" name="deal_type" defaultValue={data.deal_type ?? ""} />

      <Page no={1} active={page === 1}>
        <header className="space-y-1 text-center">
          <h2 className="text-[16px] font-bold tracking-tight print:text-[14px]">중개대상물 확인·설명서[Ⅱ] (비주거용 건축물)</h2>
          <p className="text-[11px] print:text-foreground">{title}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 py-1">
            <span className="font-medium">거래 형태</span>
            <Opt name="trade_type" value="매매·교환" data={data} label="매매·교환" />
            <Opt name="trade_type" value="임대차" data={data} label="임대차" />
            <Opt name="trade_type" value="그 밖의 유형" data={data} label="그 밖의 유형" />
          </div>
        </header>
        <table className="w-full border-collapse"><tbody>
          <tr><Th className="w-32">확인·설명 근거자료 등</Th><Td><div className="flex flex-wrap gap-x-3 gap-y-1">{check("doc_registry", "등기사항증명서")}{check("doc_land_ledger", "토지대장")}{check("doc_building_ledger", "건축물대장")}{check("doc_cadastral", "지적도")}{check("doc_land_use", "토지이용계획확인서")}{check("nonres_doc_other", "그 밖의 자료")}</div></Td></tr>
          <tr><Th>대상물건 상태 자료 요구사항</Th><Td>중개대상물의 권리관계와 상태를 확인하고, 거래당사자에게 확인한 내용을 설명합니다.</Td></tr>
        </tbody></table>
        <h3 className="pt-1 text-[13px] font-bold">I. 개업공인중개사 기본 확인사항</h3>
        <h4 className="font-semibold">① 대상물건의 표시</h4>
        <table className="w-full border-collapse"><tbody>
          <tr><Th className="w-24">소재지</Th><Td colSpan={3}><Cell name="property_address" data={data} /></Td></tr>
          <tr><Th>토지 지목</Th><Td><Cell name="land_category" data={data} /></Td><Th>면적(㎡)</Th><Td><Cell name="land_area" data={data} /></Td></tr>
          <tr><Th>건물 구조</Th><Td><Cell name="building_structure" data={data} /></Td><Th>주 용도</Th><Td><Cell name="building_use" data={data} /></Td></tr>
          <tr><Th>건축물 면적(㎡)</Th><Td><Cell name="building_area" data={data} /></Td><Th>사용승인일</Th><Td><Cell name="approval_date" data={data} /></Td></tr>
        </tbody></table>
        <h4 className="font-semibold">② 권리관계 및 거래 관련 사항</h4>
        <table className="w-full border-collapse"><tbody>
          <tr><Th className="w-28">소유권에 관한 사항</Th><Td><Area name="ownership_note" data={data} rows={2} /></Td></tr>
          <tr><Th>소유권 외 권리사항</Th><Td><Area name="rights_note" data={data} rows={2} /></Td></tr>
          <tr><Th>임대차 및 점유관계</Th><Td><Area name="occupancy_note" data={data} rows={2} /></Td></tr>
        </tbody></table>
      </Page>

      <Page no={2} active={page === 2}>
        <h3 className="text-[13px] font-bold">③ 입지조건 및 관리에 관한 사항</h3>
        <table className="w-full border-collapse"><tbody>
          <tr><Th className="w-28">도로와의 관계</Th><Td>{field("road_width", "도로 폭", "w-full")}</Td><Th className="w-24">접근성</Th><Td><Opt name="accessibility" value="양호" data={data} label="양호" /> <Opt name="accessibility" value="불편" data={data} label="불편" /></Td></tr>
          <tr><Th>대중교통</Th><Td colSpan={3}>{field("public_transport", "교통수단 및 거리", "w-full")}</Td></tr>
          <tr><Th>주차장</Th><Td colSpan={3}><Opt name="parking" value="없음" data={data} label="없음" /> <Opt name="parking" value="전용" data={data} label="전용 주차시설" /> <Opt name="parking" value="공동" data={data} label="공동 주차시설" /> <Cell name="parking_note" data={data} className="ml-2 inline-flex w-48" /></Td></tr>
          <tr><Th>관리주체</Th><Td><Opt name="management" value="위탁관리" data={data} label="위탁관리" /> <Opt name="management" value="자체관리" data={data} label="자체관리" /></Td><Th>관리비</Th><Td><Cell name="management_fee" data={data} /></Td></tr>
        </tbody></table>
        <h3 className="pt-2 text-[13px] font-bold">④ 거래예정금액 및 세금 관련 사항</h3>
        <table className="w-full border-collapse"><tbody>
          <tr><Th className="w-32">거래예정금액</Th><Td><Cell name="amount" data={data} /></Td><Th className="w-28">개별공시지가</Th><Td><Cell name="land_public_price" data={data} /></Td></tr>
          <tr><Th>건물 기준시가</Th><Td><Cell name="building_standard_price" data={data} /></Td><Th>취득세 등</Th><Td><Cell name="acquisition_tax" data={data} /></Td></tr>
          <tr><Th>세율·부담사항</Th><Td colSpan={3}><Area name="tax_note" data={data} rows={2} /></Td></tr>
        </tbody></table>
        <h3 className="pt-2 text-[13px] font-bold">⑤ 시설물의 상태</h3>
        <table className="w-full border-collapse"><tbody>
          <tr><Th>항목</Th><Th>상태</Th><Th>확인 내용 및 위치</Th></tr>
          {["수도", "전기", "가스", "소방", "승강기", "배수", "냉난방"].map((item, i) => <tr key={item}><Th className="w-24">{item}</Th><Td><Opt name={`facility_${i}`} value="정상" data={data} label="정상" /> <Opt name={`facility_${i}`} value="수리필요" data={data} label="수리 필요" /> <Opt name={`facility_${i}`} value="없음" data={data} label="해당 없음" /></Td><Td><Cell name={`facility_note_${i}`} data={data} /></Td></tr>)}
          <tr><Th>그 밖의 시설물</Th><Td colSpan={2}><Area name="facility_other" data={data} rows={2} /></Td></tr>
        </tbody></table>
      </Page>

      <Page no={3} active={page === 3} lastPage>
        <h3 className="text-[13px] font-bold">⑥ 중개보수 및 실비의 금액과 산출내역</h3>
        <table className="w-full border-collapse"><tbody>
          <tr><Th className="w-32">중개보수</Th><Td><Cell name="brokerage_fee" data={data} /></Td><Th className="w-24">요율</Th><Td><Cell name="brokerage_rate" data={data} /></Td></tr>
          <tr><Th>실비</Th><Td><Cell name="brokerage_expenses" data={data} /></Td><Th>지급시기</Th><Td><Cell name="brokerage_payment_date" data={data} /></Td></tr>
          <tr><Th>산출 근거</Th><Td colSpan={3}><Area name="brokerage_note" data={data} rows={2} /></Td></tr>
        </tbody></table>
        <div className="rounded-sm border border-foreground/40 px-2 py-1.5 text-[10.5px] leading-relaxed">
          「공인중개사법」에 따라 위 내용을 확인·설명받았으며 확인설명서와 중개대상물에 관한 자료를 교부받았습니다.
        </div>
        <p className="pt-1 text-right">작성일 <Cell name="explanation_date" data={data} className="inline-flex w-36" /></p>
        <h3 className="pt-2 text-[13px] font-bold">거래당사자 확인</h3>
        <div className="space-y-1"><PartyBlock roleLabel="매도인(임대인)" prefix="lessor" data={data} /><PartyBlock roleLabel="매수인(임차인)" prefix="lessee" data={data} /></div>
        <h3 className="pt-2 text-[13px] font-bold">개업공인중개사 확인</h3>
        <OfficeBlock prefix="" data={data} label="개업공인중개사" />
      </Page>
    </div>
  );
}

/** 중개대상물 확인·설명서[I] — PDF 4쪽 정식 양식 */
export function DisclosureFormSheet({
  propertyType,
  dealType,
  title,
  data,
  page: pageProp,
  onPageChange,
  showPageTabs = true,
}: {
  propertyType: string;
  dealType: string;
  title: string;
  data: Record<string, string>;
  /** 외부에서 페이지를 제어할 때 (다이얼로그 툴바 등) */
  page?: DisclosurePageNo;
  onPageChange?: (page: DisclosurePageNo) => void;
  /** false면 탭을 그리지 않음 — 스크롤 밖 툴바에 둘 때 */
  showPageTabs?: boolean;
}) {
  const [pageState, setPageState] = useState<DisclosurePageNo>(1);
  const page = pageProp ?? pageState;
  const setPage = onPageChange ?? setPageState;
  const isSale = dealType === "매매";
  const sellerLabel = isSale ? "매도인" : "임대인";
  const buyerLabel = isSale ? "매수인" : "임차인";
  const housingDefault =
    data.housing_type || (propertyType === "아파트" ? "공동주택" : propertyType === "오피스텔" ? "주거용오피스텔" : "단독주택");
  const tradeDefault = data.trade_type || (isSale ? "매매·교환" : "임대차");

  return (
    <div id="disclosure-print-root" className="space-y-4 bg-white text-[12px] text-foreground print:space-y-0 print:text-[10.5px]">
      <input type="hidden" name="template_title" value={title} />
      <input type="hidden" name="property_type" value={propertyType} />
      <input type="hidden" name="deal_type" value={dealType} />
      <input type="hidden" name="property_title" defaultValue={data.property_title ?? ""} />
      <input type="hidden" name="template_id" defaultValue={data.template_id ?? ""} />
      <input type="hidden" name="form_template" defaultValue={data.form_template ?? "disclosure_v1"} />
      <input type="hidden" name="disclosure_building_type" value="residential" />
      <input type="hidden" name="amount" defaultValue={data.amount ?? ""} />
      <input type="hidden" name="ownership_note" defaultValue={data.ownership_note ?? ""} />
      <input type="hidden" name="rights_note" defaultValue={data.rights_note ?? ""} />
      <input type="hidden" name="building_note" defaultValue={data.building_note ?? ""} />
      <input type="hidden" name="land_use_note" defaultValue={data.land_use_note ?? ""} />
      <input type="hidden" name="explanation_note" defaultValue={data.explanation_note ?? ""} />
      <input type="hidden" name="confirmation_note" defaultValue={data.confirmation_note ?? ""} />
      <input type="hidden" name="agent_phone" defaultValue={data.agent_phone ?? ""} />

      {showPageTabs ? (
        <DisclosurePageTabs page={page} onPageChange={setPage} className="rounded-md border border-foreground/20 px-1.5" />
      ) : null}

      {/* ─── 제1쪽 ─── */}
      <Page no={1} active={page === 1}>
        <header className="space-y-1 text-center">
          <h2 className="text-[16px] font-bold tracking-tight print:text-[14px]">중개대상물 확인·설명서[I] (주거용 건축물)</h2>
          <p className="text-[11px] text-muted-foreground print:text-foreground">{title}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1">
            <span className="font-medium">주택 유형</span>
            <Opt name="housing_type" value="단독주택" data={{ ...data, housing_type: housingDefault }} label="단독주택" />
            <Opt name="housing_type" value="공동주택" data={{ ...data, housing_type: housingDefault }} label="공동주택" />
            <Opt name="housing_type" value="주거용오피스텔" data={{ ...data, housing_type: housingDefault }} label="주거용 오피스텔" />
            <span className="ml-2 font-medium">거래 형태</span>
            <Opt name="trade_type" value="매매·교환" data={{ ...data, trade_type: tradeDefault }} label="매매·교환" />
            <Opt name="trade_type" value="임대차" data={{ ...data, trade_type: tradeDefault }} label="임대차" />
          </div>
        </header>

        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">확인·설명 근거자료 등</Th>
              <Td>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <DocCheck name="doc_title_deed" data={data} label="등기권리증" />
                  <DocCheck name="doc_registry" data={data} label="등기사항증명서" />
                  <DocCheck name="doc_land_ledger" data={data} label="토지대장" />
                  <DocCheck name="doc_building_ledger" data={data} label="건축물대장" />
                  <DocCheck name="doc_cadastral" data={data} label="지적도" />
                  <DocCheck name="doc_land_use" data={data} label="토지이용계획확인서" />
                  <label className="inline-flex items-center gap-1 text-[11px]">
                    <input
                      type="checkbox"
                      name="doc_other_flag"
                      value="1"
                      defaultChecked={Boolean(data.doc_other?.trim())}
                      className="size-3.5 accent-foreground"
                    />
                    그 밖의 자료
                    <Cell name="doc_other" data={data} className="ml-1 h-6 w-28" />
                  </label>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>대상물건의 상태에 관한 자료요구 사항</Th>
              <Td className="text-[10.5px] leading-relaxed text-muted-foreground print:text-foreground">
                개업공인중개사는 「공인중개사법」 제25조에 따라 중개대상물의 확인·설명을 위하여 필요한 자료를 열람·조사하였으며,
                매도인(임대인)은 ⑩~⑭ 항목에 대해 성실히 답변하고 개업공인중개사의 설명에 동의합니다.
              </Td>
            </tr>
          </tbody>
        </table>

        <div className="rounded-sm border border-foreground/40 bg-muted/20 px-2 py-1.5 text-[10.5px] leading-relaxed">
          <p className="font-semibold">유의사항</p>
          <p>1. 개업공인중개사는 중개대상물 확인·설명서를 작성·교부하기 전에 필요한 사항을 성실히 확인·설명하여야 합니다.</p>
          <p>2. 거래당사자는 실제 거래가액을 신고하여야 하며, 허위신고 시 관련 법령에 따라 과태료 등이 부과될 수 있습니다.</p>
        </div>

        <h3 className="pt-1 text-[13px] font-bold">I. 개업공인중개사 기본 확인사항</h3>
        <h4 className="text-[12px] font-semibold">① 대상물건의 표시</h4>

        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th rowSpan={3} className="w-12">
                토지
              </Th>
              <Th className="w-16">소재지</Th>
              <Td colSpan={5}>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="property_address" data={data} className="min-w-[12rem] flex-1" />
                  <Cell name="building" data={data} className="w-14" placeholder="동" />
                  <span>동</span>
                  <Cell name="unit" data={data} className="w-14" placeholder="호" />
                  <span>호</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>지목</Th>
              <Td>
                <NativeSelect
                  name="land_category"
                  defaultValue={data.land_category || "대"}
                  options={[...LAND_CATEGORIES]}
                  className="h-7 w-full bg-background text-[12px]"
                />
              </Td>
              <Th className="w-16">면적</Th>
              <Td colSpan={3}>
                <div className="flex items-center gap-1">
                  <Cell name="land_area" data={data} className="w-28" inputMode="decimal" />
                  <span>㎡</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>대지지분</Th>
              <Td colSpan={5}>
                <div className="flex flex-wrap items-center gap-1">
                  <Cell name="land_right_ratio_den" data={data} className="w-24" inputMode="numeric" placeholder="분모" />
                  <span>분의</span>
                  <Cell name="land_right_ratio_num" data={data} className="w-24" inputMode="numeric" placeholder="분자" />
                  <input type="hidden" name="land_right_ratio" defaultValue={data.land_right_ratio ?? ""} />
                  <input type="hidden" name="land_right_type" defaultValue={data.land_right_type ?? ""} />
                </div>
              </Td>
            </tr>
            <tr>
              <Th rowSpan={7}>건축물</Th>
              <Th>전용면적</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="building_area" data={data} className="w-24" inputMode="decimal" />
                  <span>㎡</span>
                </div>
              </Td>
              <Th>준공년도</Th>
              <Td>
                <Cell name="building_year" data={data} className="w-20" inputMode="numeric" />
              </Td>
              <Th>용도</Th>
              <Td>
                <Cell name="building_use" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>건축면적</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="arch_area" data={data} className="w-24" inputMode="decimal" />
                  <span>㎡</span>
                </div>
              </Td>
              <Th>연면적</Th>
              <Td colSpan={3}>
                <div className="flex items-center gap-1">
                  <Cell name="total_floor_area" data={data} className="w-28" inputMode="decimal" />
                  <span>㎡</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>허가일</Th>
              <Td>
                <Cell name="permit_date" data={data} className="w-32" placeholder="YYYY.MM.DD" />
              </Td>
              <Th>사용승인일</Th>
              <Td colSpan={3}>
                <Cell name="use_approval_date" data={data} className="w-32" placeholder="YYYY.MM.DD" />
              </Td>
            </tr>
            <tr>
              <Th>구조</Th>
              <Td colSpan={2}>
                <Cell name="building_structure" data={data} />
              </Td>
              <Th>방향</Th>
              <Td colSpan={2}>
                <Cell name="building_direction" data={data} placeholder="예: 남향" />
              </Td>
            </tr>
            <tr>
              <Th>내진설계</Th>
              <Td colSpan={2}>
                <Cell name="seismic_design" data={data} placeholder="적용 여부" />
              </Td>
              <Th>내진능력</Th>
              <Td colSpan={2}>
                <Cell name="seismic_capacity" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>건축물대장</Th>
              <Td colSpan={5}>
                <div className="flex flex-wrap items-center gap-3">
                  <Opt name="building_ledger_status" value="위반" data={data} label="위반" />
                  <Opt name="building_ledger_status" value="적법" data={data} label="적법" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th colSpan={6} className="bg-background text-left font-normal text-muted-foreground">
                ※ 건축물대장상 위반건축물 해당 시 세부내용을 권리관계 등에 기재합니다.
              </Th>
            </tr>
          </tbody>
        </table>

        <h4 className="text-[12px] font-semibold">② 권리관계</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th rowSpan={2} className="w-24">
                등기부 기재사항
              </Th>
              <Th className="w-20">구분</Th>
              <Th>토지</Th>
              <Th>건축물</Th>
            </tr>
            <tr>
              <Th>소유권에 관한 사항</Th>
              <Td>
                <Area name="ownership_land" data={data} rows={2} />
              </Td>
              <Td>
                <Area name="ownership_building" data={data} rows={2} />
              </Td>
            </tr>
            <tr>
              <Th colSpan={2}>소유권 외의 권리사항</Th>
              <Td>
                <Area name="rights_land" data={data} rows={2} />
              </Td>
              <Td>
                <Area name="rights_building" data={data} rows={2} />
              </Td>
            </tr>
            <tr>
              <Th colSpan={2}>신탁등기 여부</Th>
              <Td colSpan={2}>
                <div className="flex flex-wrap gap-3">
                  <Opt name="trust_reg" value="확인" data={data} label="확인" />
                  <Opt name="trust_reg" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th colSpan={2}>공동담보 여부</Th>
              <Td colSpan={2}>
                <div className="flex flex-wrap gap-3">
                  <Opt name="joint_mortgage" value="확인" data={data} label="확인" />
                  <Opt name="joint_mortgage" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th colSpan={2}>계약갱신요구권 행사여부</Th>
              <Td colSpan={2}>
                <div className="flex flex-wrap gap-3">
                  <Opt name="lease_renewal" value="확인" data={data} label="확인(서류첨부)" />
                  <Opt name="lease_renewal" value="미확인" data={data} label="미확인" />
                  <Opt name="lease_renewal" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="text-[12px] font-semibold">③ 토지이용계획, 공법상 이용제한 및 거래규제에 관한 사항</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">용도지역</Th>
              <Td>
                <Cell name="use_zone" data={data} />
              </Td>
              <Th className="w-28">용도지구</Th>
              <Td>
                <Cell name="use_district" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>용도구역</Th>
              <Td>
                <Cell name="use_area" data={data} />
              </Td>
              <Th>건폐율 상한</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="building_coverage_limit" data={data} className="w-20" />
                  <span>%</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>용적률 상한</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="floor_area_limit" data={data} className="w-20" />
                  <span>%</span>
                </div>
              </Td>
              <Th>도시·군계획시설</Th>
              <Td>
                <Cell name="urban_plan" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>토지거래허가구역</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="land_permit_zone" value="해당" data={data} label="해당" />
                  <Opt name="land_permit_zone" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
              <Th>투기·규제지역</Th>
              <Td>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-muted-foreground">토지투기</span>
                    <Opt name="speculation_area" value="해당" data={data} label="해당" />
                    <Opt name="speculation_area" value="해당없음" data={data} label="없음" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-muted-foreground">주택투기</span>
                    <Opt name="housing_speculation" value="해당" data={data} label="해당" />
                    <Opt name="housing_speculation" value="해당없음" data={data} label="없음" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-muted-foreground">투기과열</span>
                    <Opt name="overheat_district" value="해당" data={data} label="해당" />
                    <Opt name="overheat_district" value="해당없음" data={data} label="없음" />
                  </div>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>지구단위계획</Th>
              <Td colSpan={3}>
                <Cell name="district_unit_plan" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>그 밖의 이용제한·거래규제</Th>
              <Td colSpan={3}>
                <Area name="other_restriction" data={data} rows={2} />
              </Td>
            </tr>
          </tbody>
        </table>
      </Page>

      {/* ─── 제2쪽 ─── */}
      <Page no={2} active={page === 2}>
        <h4 className="text-[12px] font-semibold">④ 임대차 확인사항</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-36">확정일자 부여현황</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="fixed_date_info" value="확인" data={data} label="확인" />
                  <Opt name="fixed_date_info" value="미확인" data={data} label="미확인" />
                  <Opt name="fixed_date_info" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>국세·지방세 체납정보</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="tax_arrears_info" value="확인" data={data} label="확인" />
                  <Opt name="tax_arrears_info" value="미확인" data={data} label="미확인" />
                  <Opt name="tax_arrears_info" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>전입세대 확인서</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="move_in_confirm" value="확인" data={data} label="확인" />
                  <Opt name="move_in_confirm" value="미확인" data={data} label="미확인" />
                  <Opt name="move_in_confirm" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>소액임차인 범위·최우선변제금</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <span>범위</span>
                  <Cell name="small_tenant_range" data={data} className="w-24" />
                  <span>만원 / 최우선변제</span>
                  <Cell name="priority_pay_amount" data={data} className="w-24" />
                  <span>만원</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>민간임대등록</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="private_rental_reg" value="장기일반" data={data} label="장기일반" />
                  <Opt name="private_rental_reg" value="공공지원" data={data} label="공공지원" />
                  <Opt name="private_rental_reg" value="그밖" data={data} label="그 밖" />
                  <Opt name="private_rental_reg" value="미등록" data={data} label="미등록" />
                  <span className="ml-2">의무기간</span>
                  <Cell name="rental_obligation_years" data={data} className="w-14" />
                  <span>년 / 개시일</span>
                  <Cell name="rental_start_date" data={data} className="w-28" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>보증금보증 설명</Th>
              <Td>
                <DocCheck name="deposit_guarantee_explained" data={data} label="임대인·임차인에게 보증금 반환보증 설명을 완료함" />
              </Td>
            </tr>
            <tr>
              <Td colSpan={2} className="text-[11px]">
                <p className="mb-2 text-muted-foreground print:text-foreground">
                  위 ④항에 대해 개업공인중개사로부터 설명을 들었으며, 내용을 확인합니다.
                </p>
                <div className="flex flex-wrap gap-4">
                  <span className="inline-flex items-center gap-2">
                    {sellerLabel}
                    <Opt name="lease_confirm_lessor" value="확인" data={data} label="확인" />
                    <Opt name="lease_confirm_lessor" value="해당없음" data={data} label="해당없음" />
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {buyerLabel}
                    <Opt name="lease_confirm_lessee" value="확인" data={data} label="확인" />
                    <Opt name="lease_confirm_lessee" value="해당없음" data={data} label="해당없음" />
                  </span>
                  <span className="inline-flex items-center gap-2">
                    개업공인중개사
                    <Opt name="lease_confirm_agent" value="확인" data={data} label="확인" />
                    <Opt name="lease_confirm_agent" value="해당없음" data={data} label="해당없음" />
                  </span>
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑤ 입지조건</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">도로와의 관계</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Cell name="road_width" data={data} className="w-28" placeholder="예: 6m×8m" />
                  <Opt name="road_paved" value="1" data={data} label="포장" />
                  <Opt name="road_paved" value="0" data={data} label="비포장" />
                  <Opt name="road_access" value="용이함" data={data} label="용이함" />
                  <Opt name="road_access" value="불편함" data={data} label="불편함" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>대중교통</Th>
              <Td>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span>버스</span>
                    <Cell name="bus_stop" data={data} className="w-28" placeholder="정류장" />
                    <Cell name="bus_minutes" data={data} className="w-14" placeholder="분" />
                    <span>분</span>
                    <Opt name="bus_mode" value="도보" data={data} label="도보" />
                    <Opt name="bus_mode" value="차량" data={data} label="차량" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span>지하철</span>
                    <Cell name="subway_station" data={data} className="w-28" placeholder="역" />
                    <Cell name="subway_minutes" data={data} className="w-14" placeholder="분" />
                    <span>분</span>
                    <Opt name="subway_mode" value="도보" data={data} label="도보" />
                    <Opt name="subway_mode" value="차량" data={data} label="차량" />
                  </div>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>주차장</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="parking" value="없음" data={data} label="없음" />
                  <Opt name="parking" value="전용" data={data} label="전용" />
                  <Opt name="parking" value="공동주차시설" data={data} label="공동주차시설" />
                  <Opt name="parking" value="그밖" data={data} label="그 밖" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>교육시설</Th>
              <Td>
                <div className="space-y-1">
                  {(
                    [
                      ["초", "school_elem", "school_elem_min", "school_elem_mode"],
                      ["중", "school_mid", "school_mid_min", "school_mid_mode"],
                      ["고", "school_high", "school_high_min", "school_high_mode"],
                    ] as const
                  ).map(([label, name, min, mode]) => (
                    <div key={name} className="flex flex-wrap items-center gap-1">
                      <span className="w-6">{label}</span>
                      <Cell name={name} data={data} className="w-32" />
                      <Cell name={min} data={data} className="w-12" />
                      <span>분</span>
                      <Opt name={mode} value="도보" data={data} label="도보" />
                      <Opt name={mode} value="차량" data={data} label="차량" />
                    </div>
                  ))}
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑥ 관리에 관한 사항</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">경비실</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="security_office" value="있음" data={data} label="있음" />
                  <Opt name="security_office" value="없음" data={data} label="없음" />
                </div>
              </Td>
              <Th className="w-28">관리주체</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="manage_entity" value="위탁관리" data={data} label="위탁관리" />
                  <Opt name="manage_entity" value="자치관리" data={data} label="자치관리" />
                  <Opt name="manage_entity" value="그밖" data={data} label="그 밖" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>관리비</Th>
              <Td colSpan={3}>
                <div className="flex flex-wrap items-center gap-2">
                  <span>총액</span>
                  <Cell name="manage_fee" data={data} className="w-24" />
                  <span>원 / 공용관리비</span>
                  <Cell name="manage_fee_common" data={data} className="w-24" />
                  <span>원</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">포함항목</span>
                  <Cell name="manage_includes" data={data} className="min-w-[12rem] flex-1" placeholder="전기, 수도, 가스 등" />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">사용량 확인 가능</span>
                  <Cell name="manage_verifiable" data={data} className="min-w-[10rem] flex-1" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>부과방식</Th>
              <Td colSpan={3}>
                <div className="flex flex-wrap gap-3">
                  <Opt name="manage_billing" value="임대인직접" data={data} label="임대인에게 직접 납부" />
                  <Opt name="manage_billing" value="관리규약에 따라 부과" data={data} label="관리규약에 따라 부과" />
                  <Opt name="manage_billing" value="그밖" data={data} label="그 밖" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑦ 비선호시설 (1km 이내)</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Td>
                <div className="flex flex-wrap items-center gap-3">
                  <Opt name="disliked_facility" value="없음" data={data} label="없음" />
                  <Opt name="disliked_facility" value="있음" data={data} label="있음" />
                  <Cell name="disliked_facility_detail" data={data} className="min-w-[14rem] flex-1" placeholder="종류·위치" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑧ 거래예정금액 등</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-36">거래예정금액</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <span>₩</span>
                  <Cell name="deal_amount_won" data={data} className="w-40" inputMode="numeric" />
                  <span className="text-muted-foreground">({formatWon(data.deal_amount_won)}원)</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>개별공시지가</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="land_price_per_m2" data={data} className="w-32" inputMode="numeric" />
                  <span>원/㎡</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>건물(주택) 공시가격</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="building_official_price" data={data} className="w-40" inputMode="numeric" />
                  <span>원</span>
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑨ 취득 시 부담할 조세의 종류 및 세율</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">취득세</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="tax_acquisition" data={data} className="w-20" />
                  <span>%</span>
                </div>
              </Td>
              <Th className="w-28">농어촌특별세</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="tax_rural" data={data} className="w-20" />
                  <span>%</span>
                </div>
              </Td>
              <Th className="w-28">지방교육세</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="tax_local_edu" data={data} className="w-20" />
                  <span>%</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Td colSpan={6} className="text-[10.5px] text-muted-foreground print:text-foreground">
                ※ 재산세·종합부동산세 등은 매년 6월 1일 기준 소유자에게 부과됩니다.
              </Td>
            </tr>
          </tbody>
        </table>
      </Page>

      {/* ─── 제3쪽 ─── */}
      <Page no={3} active={page === 3}>
        <h3 className="text-[13px] font-bold">II. 개업공인중개사 세부 확인사항</h3>

        <h4 className="text-[12px] font-semibold">⑩ 실제권리관계 또는 공시되지 않은 물건의 권리 사항</h4>
        <Area name="actual_rights" data={data} rows={2} />

        <h4 className="pt-1 text-[12px] font-semibold">⑪ 내부·외부 시설물의 상태 (건축물)</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th rowSpan={2} className="w-20">
                수도
              </Th>
              <Th className="w-24">파손여부</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="water_damage" value="없음" data={data} label="없음" />
                  <Opt name="water_damage" value="있음" data={data} label="있음" />
                  <Cell name="water_damage_loc" data={data} className="w-28" placeholder="위치" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>용수량</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="water_volume" value="정상" data={data} label="정상" />
                  <Opt name="water_volume" value="부족함" data={data} label="부족함" />
                  <Cell name="water_volume_loc" data={data} className="w-28" placeholder="위치" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>전기</Th>
              <Th>공급상태</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="electric_status" value="정상" data={data} label="정상" />
                  <Opt name="electric_status" value="교체필요" data={data} label="교체필요" />
                  <Cell name="electric_replace" data={data} className="w-28" placeholder="교체부위" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>가스(취사용)</Th>
              <Th>공급방식</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="gas_supply" value="도시가스" data={data} label="도시가스" />
                  <Opt name="gas_supply" value="그밖" data={data} label="그 밖의 방식" />
                  <Cell name="gas_other" data={data} className="w-28" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>소방</Th>
              <Th>단독경보형감지기</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="fire_detector" value="없음" data={data} label="없음" />
                  <Opt name="fire_detector" value="있음" data={data} label="있음" />
                  <Opt name="fire_detector" value="해당없음" data={data} label="해당 없음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th rowSpan={2}>난방</Th>
              <Th>공급방식</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="heat_supply" value="중앙공급" data={data} label="중앙공급" />
                  <Opt name="heat_supply" value="개별공급" data={data} label="개별공급" />
                  <Opt name="heat_supply" value="지역난방" data={data} label="지역난방" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>작동·연료</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="heat_operation" value="정상" data={data} label="정상" />
                  <Opt name="heat_operation" value="수선필요" data={data} label="수선필요" />
                  <Opt name="heat_fuel" value="도시가스" data={data} label="도시가스" />
                  <Opt name="heat_fuel" value="기름" data={data} label="기름" />
                  <Opt name="heat_fuel" value="프로판가스" data={data} label="프로판" />
                  <Opt name="heat_fuel" value="연탄" data={data} label="연탄" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>승강기</Th>
              <Td colSpan={2}>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="elevator" value="있음" data={data} label="있음" />
                  <Opt name="elevator" value="없음" data={data} label="없음" />
                  <span className="text-muted-foreground">상태</span>
                  <Opt name="elevator_cond" value="양호" data={data} label="양호" />
                  <Opt name="elevator_cond" value="불량" data={data} label="불량" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>배수</Th>
              <Td colSpan={2}>
                <div className="flex flex-wrap items-center gap-2">
                  <Opt name="drainage" value="정상" data={data} label="정상" />
                  <Opt name="drainage" value="수선필요" data={data} label="수선필요" />
                  <Cell name="drainage_note" data={data} className="w-32" placeholder="위치" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>그 밖의 시설물</Th>
              <Td colSpan={2}>
                <Cell name="other_facility" data={data} />
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑫ 벽면·바닥면 및 도배상태</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-20">벽면</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-3">
                  <span>균열</span>
                  <Opt name="wall_crack" value="없음" data={data} label="없음" />
                  <Opt name="wall_crack" value="있음" data={data} label="있음" />
                  <span className="ml-2">누수</span>
                  <Opt name="wall_leak" value="없음" data={data} label="없음" />
                  <Opt name="wall_leak" value="있음" data={data} label="있음" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>바닥면</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="floor_cond" value="깨끗함" data={data} label="깨끗함" />
                  <Opt name="floor_cond" value="보통임" data={data} label="보통임" />
                  <Opt name="floor_cond" value="수리필요" data={data} label="수리필요" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>도배</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="wallpaper_cond" value="깨끗함" data={data} label="깨끗함" />
                  <Opt name="wallpaper_cond" value="보통임" data={data} label="보통임" />
                  <Opt name="wallpaper_cond" value="도배필요" data={data} label="도배필요" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑬ 환경조건</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-20">일조량</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="sunlight" value="풍부함" data={data} label="풍부함" />
                  <Opt name="sunlight" value="보통임" data={data} label="보통임" />
                  <Opt name="sunlight" value="불충분" data={data} label="불충분" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>소음</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="noise" value="아주 작음" data={data} label="아주 작음" />
                  <Opt name="noise" value="보통임" data={data} label="보통임" />
                  <Opt name="noise" value="심한 편임" data={data} label="심한 편임" />
                </div>
              </Td>
            </tr>
            <tr>
              <Th>진동</Th>
              <Td>
                <div className="flex flex-wrap gap-3">
                  <Opt name="vibration" value="아주 작음" data={data} label="아주 작음" />
                  <Opt name="vibration" value="보통임" data={data} label="보통임" />
                  <Opt name="vibration" value="심한 편임" data={data} label="심한 편임" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <h4 className="pt-1 text-[12px] font-semibold">⑭ 현장안내</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">현장안내자</Th>
              <Td>
                <div className="flex flex-wrap items-center gap-3">
                  <Opt name="site_guide" value="개업공인중개사" data={data} label="개업공인중개사" />
                  <Opt name="site_guide" value="소속공인중개사" data={data} label="소속공인중개사" />
                  <Opt name="site_guide" value="중개보조원" data={data} label="중개보조원" />
                  <Opt name="site_guide" value="해당없음" data={data} label="해당 없음" />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">신분 고지</span>
                  <Opt name="site_guide_id_check" value="예" data={data} label="예" />
                  <Opt name="site_guide_id_check" value="아니오" data={data} label="아니오" />
                </div>
              </Td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10.5px] text-muted-foreground print:text-foreground">
          ※ 중개보조원은 현장안내 시 중개보조원임을 밝혀야 합니다(「공인중개사법」).
        </p>
      </Page>

      {/* ─── 제4쪽 ─── */}
      <Page no={4} active={page === 4}>
        <h3 className="text-[13px] font-bold">III. 중개보수 등에 관한 사항</h3>
        <h4 className="text-[12px] font-semibold">⑮ 중개보수</h4>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <Th className="w-28">중개보수</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="fee_amount" data={data} className="w-36" inputMode="numeric" />
                  <span>원</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>실비</Th>
              <Td>
                <div className="flex items-center gap-1">
                  <Cell name="fee_expense" data={data} className="w-36" inputMode="numeric" />
                  <span>원</span>
                </div>
              </Td>
            </tr>
            <tr>
              <Th>지급시기</Th>
              <Td>
                <Cell name="fee_pay_timing" data={data} />
              </Td>
            </tr>
            <tr>
              <Th>산출내역</Th>
              <Td>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1">
                    <span>중개보수 :</span>
                    <span>(</span>
                    <Cell name="fee_base_won" data={data} className="w-32" inputMode="numeric" placeholder="거래가액" />
                    <span>원) ×</span>
                    <Cell name="fee_rate" data={data} className="w-16" inputMode="decimal" />
                    <span>%</span>
                  </div>
                  <Cell name="fee_expense_detail" data={data} placeholder="실비 내역" />
                  <p className="text-[10.5px] text-muted-foreground print:text-foreground">
                    ※ 중개보수는 지방자치단체 조례상 한도 내에서 협의하여 결정하며, 부가가치세는 별도일 수 있습니다.
                  </p>
                </div>
              </Td>
            </tr>
          </tbody>
        </table>

        <p className="pt-2 text-center text-[11px] leading-relaxed">
          개업공인중개사로부터 중개대상물에 관한 확인·설명 및 손해배상책임 보장에 관한 설명을 듣고 본 확인·설명서를 수령합니다.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 py-2">
          <DatePicker name="contract_date" defaultValue={data.contract_date ?? ""} className="w-40" />
        </div>

        <div className="space-y-3">
          <PartyBlock roleLabel={sellerLabel} prefix="lessor" data={data} />
          <PartyBlock roleLabel={buyerLabel} prefix="lessee" data={data} />
          <OfficeBlock prefix="" data={data} label={"개업공인중개사"} />
          <OfficeBlock prefix="joint_" data={data} label={"개업공인중개사\n(공동)"} />
        </div>
      </Page>
    </div>
  );
}
