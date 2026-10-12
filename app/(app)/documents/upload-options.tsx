"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { properties } from "@/lib/mock/properties";

const documentTypes = [
  { value: "auto", label: "자동 분류" },
  { value: "등기사항증명서", label: "등기사항증명서" },
  { value: "건축물대장", label: "건축물대장" },
];

const propertyItems = properties.map((p) => ({ value: p.id, label: p.title }));

export function DocumentUploadOptions() {
  return (
    <>
      <div className="space-y-2">
        <Label>연결할 매물</Label>
        <Select items={propertyItems} defaultValue={properties[0].id}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {propertyItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>문서 종류</Label>
        <Select items={documentTypes} defaultValue="auto">
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
