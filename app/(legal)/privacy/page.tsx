import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, type LegalSection } from "@/components/legal-document";

export const metadata: Metadata = { title: "개인정보 처리방침" };

const sections: LegalSection[] = [
  {
    id: "items",
    title: "1. 수집하는 개인정보 항목",
    body: (
      <table>
        <thead>
          <tr>
            <th>구분</th>
            <th>항목</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>회원가입 (필수)</td>
            <td>이름, 이메일, 비밀번호</td>
          </tr>
          <tr>
            <td>회원가입 (선택)</td>
            <td>휴대폰 번호, 중개사 자격번호·개설등록번호, 사무소 이름</td>
          </tr>
          <tr>
            <td>사무소 정보</td>
            <td>사무소명, 대표자, 개설등록번호, 대표 전화, 주소</td>
          </tr>
          <tr>
            <td>서비스 이용 과정</td>
            <td>접속 일시, IP 주소, 브라우저 정보, 쿠키(로그인 유지용)</td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "purpose",
    title: "2. 개인정보의 이용 목적",
    body: (
      <ul>
        <li>회원 식별, 가입 의사 확인, 계정 관리 및 본인 확인</li>
        <li>공인중개사 자격 확인 및 사무소 구성원 관리</li>
        <li>서비스 제공(매물·고객·문서 관리, 브리핑 공유 등) 및 고객 문의 대응</li>
        <li>서비스 개선, 부정 이용 방지, 보안 사고 대응</li>
        <li>마케팅 수신에 동의한 경우 실무 콘텐츠·혜택 안내</li>
      </ul>
    ),
  },
  {
    id: "customer-data",
    title: "3. 회원이 등록하는 고객 정보의 처리",
    body: (
      <>
        <p>
          회원이 업무를 위해 등록하는 고객(매수·임차 희망자, 임대인 등)의 이름·연락처·상담 내용은 회원(중개사무소)이
          처리하는 개인정보이며, 회사는 이를 회원의 위탁을 받아 보관·처리하는 수탁자의 지위에 있습니다.
        </p>
        <ul>
          <li>고객 정보는 같은 사무소 구성원만 열람할 수 있어요.</li>
          <li>고객 브리핑 공유 링크에는 고객 개인정보, 내부 메모, 상세 주소가 포함되지 않아요.</li>
          <li>회원은 고객 정보를 등록하기 전에 관련 법령에 따른 동의 등 처리 근거를 갖추어야 해요.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "4. 보유 및 이용 기간",
    body: (
      <>
        <p>회원 탈퇴 시 지체 없이 파기합니다. 단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
        <ul>
          <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
          <li>접속 기록: 3개월 (통신비밀보호법)</li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party",
    title: "5. 개인정보의 제3자 제공",
    body: <p>회사는 정보주체의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.</p>,
  },
  {
    id: "outsourcing",
    title: "6. 개인정보 처리의 위탁",
    body: (
      <>
        <p>회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.</p>
        <table>
          <thead>
            <tr>
              <th>수탁자</th>
              <th>위탁 업무</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase Inc.</td>
              <td>회원 인증, 데이터베이스 및 파일 저장소 운영</td>
            </tr>
            <tr>
              <td>호스팅 사업자 (출시 시 고지)</td>
              <td>웹 서비스 호스팅</td>
            </tr>
          </tbody>
        </table>
        <p>수탁자의 서버가 국외에 있는 경우 이전 국가, 이전 일시·방법, 보유 기간을 출시 전 이 방침에 추가로 고지합니다.</p>
      </>
    ),
  },
  {
    id: "destruction",
    title: "7. 개인정보의 파기",
    body: (
      <ul>
        <li>보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.</li>
        <li>전자 파일은 복구할 수 없는 방법으로 삭제하며, 업로드한 사진·음성·서류 파일도 함께 삭제합니다.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "8. 정보주체의 권리와 행사 방법",
    body: (
      <ul>
        <li>회원은 언제든지 마이페이지·설정에서 본인 정보를 조회·수정할 수 있어요.</li>
        <li>열람, 정정, 삭제, 처리정지를 요청할 수 있으며, 회사는 지체 없이 조치합니다.</li>
        <li>회원이 등록한 고객의 권리 행사 요청은 해당 중개사무소(회원)를 통해 처리됩니다.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "9. 안전성 확보 조치",
    body: (
      <ul>
        <li>비밀번호 암호화 저장, 전송 구간 암호화(HTTPS)</li>
        <li>사무소 단위 접근 통제(행 단위 보안 정책) 및 권한별 기능 제한</li>
        <li>업로드 파일 비공개 저장, 만료 시간이 있는 열람 링크 사용</li>
        <li>접속 기록 보관 및 정기 점검</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "10. 쿠키의 사용",
    body: <p>로그인 상태 유지를 위해 필수 쿠키를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인이 필요한 서비스를 이용할 수 없습니다.</p>,
  },
  {
    id: "officer",
    title: "11. 개인정보 보호책임자",
    body: (
      <>
        <p>개인정보 관련 문의, 불만 처리, 피해 구제는 아래로 연락해 주세요.</p>
        <ul>
          <li>개인정보 보호책임자: 출시 전 지정 예정</li>
          <li>이메일: privacy@zipand.kr (예정)</li>
        </ul>
        <p>
          개인정보 침해 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회
          (kopico.go.kr, 1833-6972)에 문의할 수 있습니다.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "12. 처리방침의 변경",
    body: <p>이 개인정보 처리방침은 2026년 10월 12일부터 적용되며, 변경 시 시행 7일 전부터 서비스 화면을 통해 공지합니다.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="개인정보 처리방침"
      effectiveDate="2026년 10월 12일"
      intro={
        <>
          집앤은 「개인정보 보호법」에 따라 이용자의 개인정보를 보호하고 관련 고충을 원활하게 처리하기 위해 다음과 같은
          처리방침을 둡니다. 서비스 이용 조건은{" "}
          <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
            이용약관
          </Link>
          을 확인해 주세요.
        </>
      }
      sections={sections}
    />
  );
}
