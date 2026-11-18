import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  { name: "Nguyễn Văn A", role: "Recruiter", status: "Active" },
  { name: "Trần Thị B", role: "Interviewer", status: "Away" },
  { name: "Lê Văn C", role: "Admin", status: "Active" },
];

export default function UiDemo() {
  const [select, setSelect] = useState("");
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">UI Demo — shadcn/ui</h1>
        <p className="text-muted-foreground">
          Trang thử nghiệm. Xóa route này khi không cần nữa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Button + Badge</CardTitle>
          <CardDescription>Các variant của Button, Badge</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>Input, Label, Textarea, Select</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="demo-email">Email</Label>
            <Input id="demo-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-note">Ghi chú</Label>
            <Textarea id="demo-note" placeholder="Nội dung..." />
          </div>
          <div className="grid gap-2">
            <Label>Vai trò</Label>
            <Select onValueChange={setSelect} value={select}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="interviewer">Interviewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Table + Dialog</CardTitle>
          <CardDescription>
            Lưu ý khi dùng trong trang cũ: thêm className="z-[1100]" cho
            DialogContent để nổi trên header/modal cũ (z-index 1000–1050)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Active" ? "default" : "secondary"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Mở Dialog</Button>
            </DialogTrigger>
            <DialogContent className="z-[1100]">
              <DialogHeader>
                <DialogTitle>Dialog shadcn/ui</DialogTitle>
                <DialogDescription>
                  Dialog với z-index tương thích trang cũ.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Đã hiểu</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
