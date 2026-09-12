import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { EmailSettingsForm, TestEmailForm } from "@/components/admin/settings-forms";
import { Badge, Card, Table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { getSettings, redactSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "E-posta Ayarları" };

const STATUS = {
  sent: { label: "Gönderildi", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  failed: { label: "Hata", cls: "bg-red-50 text-red-700 ring-red-200" },
  skipped: { label: "Atlandı", cls: "bg-zinc-100 text-zinc-600 ring-zinc-200" },
} as const;

export default async function EmailSettingsPage() {
  const admin = await requireAdmin();
  const [settings, logs] = await Promise.all([
    getSettings(),
    db.select().from(emailLogs).orderBy(desc(emailLogs.createdAt)).limit(20),
  ]);
  const { settings: safe, secretsSet } = redactSettings(settings);

  return (
    <div className="space-y-8">
      <EmailSettingsForm settings={safe} secretsSet={secretsSet} />
      <Card title="Test e-postası" description="Ayarları kaydettikten sonra gönderimi deneyin.">
        <TestEmailForm defaultTo={settings.adminNotifyEmail || admin.email} />
      </Card>
      <Card title="Son gönderimler" className="[&>div:last-child]:p-0">
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">Henüz e-posta gönderilmedi.</p>
        ) : (
          <div className="[&>div]:rounded-none [&>div]:border-0">
            <Table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Alıcı</th>
                  <th>Konu</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-zinc-500">{formatDate(log.createdAt)}</td>
                    <td>{log.to}</td>
                    <td>
                      {log.subject}
                      {log.error && <p className="text-xs text-red-600">{log.error}</p>}
                    </td>
                    <td>
                      <Badge className={STATUS[log.status].cls}>{STATUS[log.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
