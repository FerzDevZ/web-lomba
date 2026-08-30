"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioCardGroup } from "@/components/ui/radio-card-group";

type Role = "CUSTOMER" | "PROVIDER";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    role: "CUSTOMER" as Role,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Generic supaya key harus benar-benar ada di form dan value bertipe sesuai
  // field-nya — sebelumnya (string, string) menerima key apa pun tanpa error.
  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Gagal mendaftar. Coba lagi.");
      setLoading(false);
      return;
    }

    // loading dibiarkan true sampai navigasi selesai: kalau di-reset di sini,
    // tombol aktif kembali selama transisi dan pendaftaran bisa terkirim dua kali.
    router.push("/login?registered=1");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle as="h1" className="text-2xl">
          Daftar Akun ServisLokal
        </CardTitle>
        <CardDescription>
          Mulai pesan jasa atau buka jasa Anda sendiri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Nama Anda"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. HP (opsional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          {form.role === "PROVIDER" && (
            <div className="space-y-2">
              <Label htmlFor="location">
                Kota / Daerah Layanan{" "}
                <span className="text-destructive-strong">*</span>
              </Label>
              <Input
                id="location"
                placeholder="Contoh: Jakarta Selatan"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Pelanggan memfilter jasa berdasarkan lokasi ini.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Daftar sebagai</Label>
            <RadioCardGroup
              label="Daftar sebagai"
              columns={2}
              value={form.role}
              onChange={(role) => update("role", role)}
              options={[
                {
                  value: "CUSTOMER",
                  label: "Customer",
                  description: "Saya ingin memesan jasa",
                },
                {
                  value: "PROVIDER",
                  label: "Provider",
                  description: "Saya ingin membuka jasa",
                },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Hubungi admin jika perlu mengubah role setelah daftar.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive-strong"
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-strong hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
