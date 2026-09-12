import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ConfirmForm } from "@/components/admin/form-client";
import { PasswordForm } from "@/components/admin/forms";
import { Badge, Card, Table } from "@/components/admin/ui";
import { CreateAdminForm, OwnAccountForm } from "@/components/admin/user-forms";
import { deleteAdmin } from "@/lib/actions/admin-users";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Yöneticiler" };

export default async function AdminsPage() {
  const me = await requireAdmin();
  const admins = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.createdAt));
  const self = admins.find((a) => a.id === me.id)!;

  return (
    <div className="space-y-8">
      <Card title="Hesabım">
        <OwnAccountForm user={self} />
      </Card>
      <Card title="Şifremi değiştir">
        <PasswordForm />
      </Card>
      <Card title="Yöneticiler" description="Tüm yöneticiler panelin tamamına erişebilir." className="[&>div:last-child]:p-0">
        <div className="[&>div]:rounded-none [&>div]:border-0">
          <Table>
            <thead>
              <tr>
                <th>Ad</th>
                <th>E-posta</th>
                <th>Eklenme</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.name || "—"} {a.id === me.id && <Badge>Siz</Badge>}
                  </td>
                  <td>{a.email}</td>
                  <td className="text-zinc-500">{formatDate(a.createdAt)}</td>
                  <td className="text-right">
                    {a.id !== me.id && admins.length > 1 && (
                      <ConfirmForm action={deleteAdmin} id={a.id} message={`${a.email} yönetici hesabı silinsin mi?`} className="text-xs text-red-600 hover:underline">
                        Sil
                      </ConfirmForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
      <Card title="Yeni yönetici ekle">
        <CreateAdminForm />
      </Card>
    </div>
  );
}
