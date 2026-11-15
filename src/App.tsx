import { useEffect, useState, type ReactNode } from "react"
import { Link, Navigate, Route, Routes, useNavigate } from "react-router"
import { IconArrowRight, IconBellRinging, IconBuildingCommunity, IconCash, IconChevronDown, IconFileTypePdf, IconHelpCircle, IconKey, IconPlus, IconSchool, IconSend, IconTicket, IconUsers } from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { api, setToken, type SessionUser } from "../shared/src/api"
import { Sprout } from "../shared/src/art"
import { FileDrop, FormSection, Fields, Select, TextArea, TextField } from "../shared/src/form"
import { useI18n } from "../shared/src/i18n"
import { Resource, type Field } from "../shared/src/resource"
import { Boot, LoginCard, Shell, type NavItem } from "../shared/src/shell"
import { Alert, Avatar, Bars, Button, Card, CardHead, CardSkeleton, Dialog, EmptyState, Meter, PageHeader, Skeleton, StatCard, StatusBadge, celebrate, useAction } from "../shared/src/ui"

const nav: (NavItem & { permission?: string })[] = [
  { to: "/", ar: "نظرة عامة", en: "Overview", group: "" },
  { to: "/teachers", ar: "المعلمون", en: "Teachers", permission: "can-view-teachers", group: "الناس|People" },
  { to: "/institutes", ar: "المعاهد", en: "Institutes", permission: "can-view-institutes" },
  { to: "/students", ar: "الطلاب", en: "Students", permission: "can-view-students" },
  { to: "/employees", ar: "الموظفون", en: "Employees", permission: "can-view-employees" },
  { to: "/sections", ar: "الأقسام", en: "Sections", permission: "can-view-sections", group: "الكتالوج|Catalog" },
  { to: "/grades", ar: "المراحل", en: "Grades", permission: "can-view-grades" },
  { to: "/subjects", ar: "المواد", en: "Subjects", permission: "can-view-subjects" },
  { to: "/domains", ar: "المجالات", en: "Domains", permission: "can-view-learning-domains" },
  { to: "/governorates", ar: "المحافظات", en: "Governorates", permission: "can-view-governorates" },
  { to: "/plans", ar: "الباقات السنوية", en: "Yearly plans", permission: "can-view-plans", group: "التجارة|Commerce" },
  { to: "/subscriptions", ar: "الاشتراكات", en: "Subscriptions", permission: "can-view-subscriptions" },
  { to: "/invoices", ar: "الفواتير", en: "Invoices", permission: "can-view-invoices" },
  { to: "/codes", ar: "الأكواد", en: "Codes", permission: "can-view-codes" },
  { to: "/hours", ar: "باقات الساعات", en: "Hour packages", permission: "can-view-hour-packages" },
  { to: "/ads", ar: "الإعلانات", en: "Advertisements", permission: "can-view-advertisements", group: "المحتوى|Content" },
  { to: "/guides", ar: "الأدلة", en: "Guides", permission: "can-view-guides" },
  { to: "/faq", ar: "الأسئلة", en: "FAQ", permission: "can-view-faq" },
  { to: "/notifications", ar: "الإشعارات", en: "Notifications", permission: "can-create-notifications" },
  { to: "/scheduled", ar: "الإشعارات المجدولة", en: "Scheduled", permission: "can-view-notifications" },
  { to: "/reports", ar: "التقارير", en: "Reports", permission: "can-view-reports", group: "النظام|System" },
  { to: "/parameters", ar: "إعدادات النظام", en: "Parameters", permission: "can-view-parameters" },
]

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Frame />} />
    </Routes>
  )
}

function Login() {
  const navigate = useNavigate()
  const { tr } = useI18n()
  return <LoginCard title={tr("لوحة مدير النظام", "Super admin")} onSubmit={async (phone, password) => {
    const result = await api<{ token: string }>("/api/auth/admin/login", { method: "POST", body: JSON.stringify({ phone, password }) })
    setToken(result.token)
    navigate("/")
  }} />
}

/** A page: header from the menu entry, then the content. */
function Screen({ lede, actions, children }: { lede?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return <div className="page"><PageHeader lede={lede} actions={actions} />{children}</div>
}

function Frame() {
  const [me, setMe] = useState<SessionUser | null>(null)
  const navigate = useNavigate()
  const { tr } = useI18n()
  useEffect(() => {
    api<SessionUser>("/api/auth/me").then(setMe).catch(() => navigate("/login"))
  }, [navigate])
  if (!me) return <Boot />
  const items = nav.filter((item) => !item.permission || me.permissions.includes(item.permission))
  const L = tr
  return (
    <Shell title={tr("الإدارة", "Admin")} items={items} user={me}>
      <Routes>
        <Route path="/" element={<Overview me={me} items={items} />} />
        <Route path="/teachers" element={<Screen lede={L("حسابات المعلمين واعتمادهم ونهاية التجربة والاشتراك.", "Teacher accounts, approval, trial end, and subscription end.")}>
          <Resource path="/api/admin/teachers" title={L("المعلمون", "Teachers")} createLabel={L("معلم جديد", "New teacher")} columns={[
            { key: "name", label: L("الاسم", "Name"), value: (row) => [row.firstName, row.lastName].filter(Boolean).join(" "), render: (row) => <PersonCell name={[row.firstName, row.lastName].filter(Boolean).join(" ")} /> },
            { key: "phone", label: L("الهاتف", "Phone"), render: (row) => <Phone value={row.phone} /> },
            { key: "status", label: L("الحالة", "Status"), render: (row) => <StatusBadge value={row.status} /> },
            { key: "teacherApproved", label: L("الموافقة", "Approval"), render: (row) => <StatusBadge value={row.teacherApproved} /> },
            { key: "trialEndsAt", label: L("نهاية التجربة", "Trial end") },
            { key: "subscriptionEndsAt", label: L("نهاية الاشتراك", "Subscription end") },
          ]} fields={teacherFields(L)} />
        </Screen>} />
        <Route path="/institutes" element={<Institutes />} />
        <Route path="/students" element={<Screen lede={L("كل الطلاب المسجلين في الأكاديمية.", "Every student registered in the academy.")}>
          <Resource path="/api/admin/students" title={L("الطلاب", "Students")} columns={[
            { key: "firstName", label: L("الاسم", "Name"), render: (row) => <PersonCell name={String(row.firstName ?? "")} /> },
            { key: "phone", label: L("الهاتف", "Phone"), render: (row) => <Phone value={row.phone} /> },
            { key: "status", label: L("الحالة", "Status") },
          ]} />
        </Screen>} />
        <Route path="/employees" element={<Screen lede={L("فريق الإدارة: مساعدون وموظفون.", "The admin team: assistants and staff.")}>
          <Resource path="/api/admin/employees" title={L("الموظفون", "Employees")} createLabel={L("موظف جديد", "New employee")} columns={[
            { key: "firstName", label: L("الاسم", "Name"), render: (row) => <PersonCell name={String(row.firstName ?? "")} /> },
            { key: "phone", label: L("الهاتف", "Phone"), render: (row) => <Phone value={row.phone} /> },
            { key: "employeeStyle", label: L("النوع", "Style"), render: (row) => <StatusBadge value={row.employeeStyle} /> },
          ]} fields={[
            { name: "firstName", label: L("الاسم", "Name") },
            { name: "lastName", label: L("اللقب", "Last") },
            { name: "phone", label: L("الهاتف", "Phone") },
            { name: "password", label: L("كلمة المرور", "Password"), type: "password", help: L("ثمانية أحرف على الأقل", "At least 8 characters") },
            { name: "style", label: L("النوع", "Style"), type: "select", options: ["Assistant", "Staff"] },
          ]} />
        </Screen>} />
        <Route path="/sections" element={<Named path="/api/admin/sections" title={L("الأقسام", "Sections")} lede={L("الأقسام الدراسية التي تتفرع منها المراحل.", "Study sections that grades belong to.")} />} />
        <Route path="/grades" element={<Named path="/api/admin/grades" title={L("المراحل", "Grades")} lede={L("المراحل الدراسية المتاحة للدورات والطلاب.", "Grades available to courses and students.")} />} />
        <Route path="/subjects" element={<Named path="/api/admin/subjects" title={L("المواد", "Subjects")} lede={L("المواد التي تُبنى عليها الدورات.", "Subjects courses are built on.")} />} />
        <Route path="/domains" element={<Named path="/api/admin/learning-domains" title={L("المجالات", "Domains")} lede={L("مجالات التعلّم في الكتالوج.", "Learning domains in the catalog.")} />} />
        <Route path="/governorates" element={<Named path="/api/admin/governorates" title={L("المحافظات", "Governorates")} lede={L("المحافظات المستخدمة في ملفات الطلاب.", "Governorates used on student records.")} />} />
        <Route path="/plans" element={<Screen lede={L("باقات الأكواد السنوية للمعلمين والمعاهد، بالدينار العراقي.", "Yearly code plans for teachers and institutes, in Iraqi dinars.")}>
          <Resource path="/api/admin/plans" title={L("الباقات", "Plans")} createLabel={L("باقة جديدة", "New plan")} columns={[
            { key: "title", label: L("العنوان", "Title") },
            { key: "audience", label: L("النوع", "Type"), render: (row) => <StatusBadge value={row.audience} /> },
            { key: "priceYearly", label: "IQD", align: "end", render: (row) => <Money value={row.priceYearly} /> },
            { key: "codesCount", label: L("الأكواد", "Codes"), align: "end" },
          ]} fields={[
            { name: "title", label: L("العنوان", "Title") },
            { name: "description", label: L("الوصف", "Description"), type: "textarea" },
            { name: "audience", label: L("النوع", "Type"), type: "select", options: ["ForTeacher", "ForInstitute"] },
            { name: "priceYearly", label: "IQD", type: "number" },
            { name: "codesCount", label: L("عدد الأكواد", "Codes"), type: "number" },
          ]} />
        </Screen>} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/invoices" element={<Screen lede={L("فواتير يدوية: المبلغ وعدد الأكواد كما يُدخلان.", "Manual invoices: the amount and code count as entered.")}>
          <Resource path="/api/admin/invoices" title={L("الفواتير", "Invoices")} createLabel={L("فاتورة جديدة", "New invoice")} columns={[
            { key: "amountIqd", label: "IQD", render: (row) => <Money value={row.amountIqd} /> },
            { key: "activatedCodesCount", label: L("أكواد مفعّلة", "Activated codes"), align: "end" },
            { key: "note", label: L("ملاحظة", "Note") },
          ]} fields={[
            { name: "partyUserId", label: L("معرف الجهة", "Party id") },
            { name: "amountIqd", label: "IQD", type: "number" },
            { name: "activatedCodesCount", label: L("عدد الأكواد", "Codes"), type: "number" },
            { name: "note", label: L("ملاحظة", "Note"), type: "textarea" },
          ]} />
        </Screen>} />
        <Route path="/codes" element={<Screen lede={L("أكواد التفعيل وحالتها وهدفها وتاريخ انتهائها.", "Activation codes with their status, target, and expiry.")}>
          <Resource path="/api/admin/codes" title={L("الأكواد", "Codes")} columns={[
            { key: "code", label: L("الكود", "Code"), render: (row) => <span className="code-chip">{String(row.code ?? "—")}</span> },
            { key: "status", label: L("الحالة", "Status") },
            { key: "targetType", label: L("الهدف", "Target") },
            { key: "expiresAt", label: L("الانتهاء", "Expires") },
          ]} />
        </Screen>} />
        <Route path="/ads" element={<Screen lede={L("إعلانات تظهر في تطبيق الطالب.", "Advertisements shown in the student app.")}>
          <Resource path="/api/admin/advertisements" title={L("الإعلانات", "Ads")} createLabel={L("إعلان جديد", "New ad")} columns={[
            { key: "title", label: L("العنوان", "Title") },
            { key: "active", label: L("ظاهر", "Active") },
          ]} fields={[
            { name: "title", label: L("العنوان", "Title") },
            { name: "body", label: L("النص", "Body"), type: "textarea" },
            { name: "linkUrl", label: L("الرابط", "Link") },
          ]} />
        </Screen>} />
        <Route path="/guides" element={<Screen lede={L("أدلة الاستخدام التي يقرؤها المعلمون والمعاهد.", "How-to guides teachers and institutes read.")}>
          <Resource path="/api/admin/guides" title={L("الأدلة", "Guides")} createLabel={L("دليل جديد", "New guide")} columns={[{ key: "title", label: L("العنوان", "Title") }]} fields={[
            { name: "title", label: L("العنوان", "Title") },
            { name: "body", label: L("النص", "Body"), type: "textarea" },
          ]} />
        </Screen>} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/notifications" element={<Notify />} />
        <Route path="/scheduled" element={<Screen lede={L("إشعارات تُرسل في موعدها ثم تتكرر.", "Notifications sent at their time, then repeated.")}>
          <Resource path="/api/admin/scheduled-notifications" title={L("المجدولة", "Scheduled")} createLabel={L("جدولة إشعار", "Schedule a notification")} columns={[
            { key: "title", label: L("العنوان", "Title") },
            { key: "audience", label: L("الجمهور", "Audience"), render: (row) => <StatusBadge value={row.audience} /> },
            { key: "repeat", label: L("التكرار", "Repeat"), render: (row) => <StatusBadge value={row.repeat} /> },
            { key: "nextRunAt", label: L("الموعد", "Next") },
          ]} fields={scheduleFields(L)} />
        </Screen>} />
        <Route path="/parameters" element={<Parameters />} />
        <Route path="/reports" element={<Screen lede={L("تقرير الأكواد ومالكيها.", "Codes and their owners.")}>
          <Resource path="/api/admin/reports/codes" title={L("تقارير الأكواد", "Code reports")} columns={[
            { key: "code", label: L("الكود", "Code"), render: (row) => <span className="code-chip">{String(row.code ?? "—")}</span> },
            { key: "status", label: L("الحالة", "Status") },
            { key: "ownerUserId", label: L("المالك", "Owner"), render: (row) => <span className="mono text-3">{String(row.ownerUserId ?? "—")}</span> },
          ]} />
        </Screen>} />
        <Route path="/hours" element={<Screen lede={L("باقات ساعات الحصص المباشرة. علم الحضور يُخزّن فقط.", "Live-class hour packages. The attendance flag is stored only.")}>
          <Resource path="/api/admin/hour-packages" title={L("باقات الساعات", "Hour packages")} createLabel={L("باقة ساعات جديدة", "New hour package")} columns={[
            { key: "name", label: L("الاسم", "Name") },
            { key: "monthlyHoursLimit", label: L("الساعات", "Hours"), align: "end" },
            { key: "monthlyMinutesLimit", label: L("الدقائق", "Minutes"), align: "end" },
            { key: "attendanceEnabled", label: L("علم الحضور", "Attendance flag") },
          ]} fields={hourFields(L)} />
        </Screen>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

type L = (ar: string, en: string) => string

function PersonCell({ name }: { name: string }) {
  return <span className="cell-main"><Avatar name={name || "?"} />{name || "—"}</span>
}

function Phone({ value }: { value: unknown }) {
  return value ? <span dir="ltr" className="num">{String(value)}</span> : <span className="muted">—</span>
}

function Money({ value }: { value: unknown }) {
  const { locale } = useI18n()
  if (value == null || value === "") return <span className="muted">—</span>
  const n = Number(value)
  return <span className="num" style={{ fontWeight: 600 }}>{Number.isFinite(n) ? n.toLocaleString(locale) : String(value)} <small className="text-3">IQD</small></span>
}

function Overview({ me, items }: { me: SessionUser; items: NavItem[] }) {
  const { tr, locale } = useI18n()
  const [counts, setCounts] = useState<{ label: string; value: number; to: string }[] | null>(null)
  const [teachers, setTeachers] = useState<{ id: string; firstName: string; phone: string; teacherApproved?: boolean }[] | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    const sources: [string, string, string][] = [
      ["/api/admin/teachers", tr("المعلمون", "Teachers"), "/teachers"],
      ["/api/admin/students", tr("الطلاب", "Students"), "/students"],
      ["/api/admin/institutes", tr("المعاهد", "Institutes"), "/institutes"],
      ["/api/admin/codes", tr("الأكواد", "Codes"), "/codes"],
    ]
    Promise.all(sources.map(async ([path, label, to]) => {
      try {
        const page = await api<{ total: number }>(`${path}?page=1&pageSize=1`)
        return { label, value: page.total, to }
      } catch { return null }
    })).then((rows) => setCounts(rows.filter((row): row is { label: string; value: number; to: string } => row !== null)))
      .catch((reason) => setError(reason.message))
    api<{ items: { id: string; firstName: string; phone: string; teacherApproved?: boolean }[] }>("/api/admin/teachers?page=1&pageSize=5")
      .then((page) => setTeachers(page.items ?? []))
      .catch(() => setTeachers([]))
  }, [tr])
  const icons = [IconUsers, IconSchool, IconBuildingCommunity, IconTicket]
  const tones = ["sky", "yellow", "purple", "green"] as const
  const date = new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const canSee = (to: string) => items.some((item) => item.to === to)
  return (
    <div className="page">
      <section className="hero navy" style={{ marginTop: 16 }}>
        <div>
          <p className="hero-date">{date}</p>
          <h1>{tr(`أهلاً بعودتك، ${me.name || ""}`, `Welcome back, ${me.name || ""}`)}</h1>
          <p>{tr("الأعداد أدناه من الواجهة البرمجية مباشرة، بلا تقدير.", "The counts below come straight from the API, with no estimates.")}</p>
          <div className="hero-actions">
            {canSee("/teachers") ? <Link className="btn primary" to="/teachers"><IconUsers size={19} />{tr("المعلمون", "Teachers")}</Link> : null}
            {canSee("/notifications") ? <Link className="btn on-hero-ghost" to="/notifications"><IconBellRinging size={19} />{tr("إشعار فوري", "Send a notification")}</Link> : null}
          </div>
        </div>
        <Sprout className="hero-art" mood="wave" />
      </section>
      {error ? <Alert tone="bad">{error}</Alert> : null}
      {counts === null ? <CardSkeleton count={4} /> : counts.length === 0 ? null : (
        <div className="stats">
          {counts.map((item, index) => (
            <Link key={item.to} to={item.to} style={{ display: "block" }}>
              <StatCard label={item.label} value={item.value} icon={icons[index]} tone={tones[index]} hero={index === 0} hint={<span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>{tr("فتح القائمة", "Open the list")}<IconArrowRight size={14} className="flip-rtl" /></span>} />
            </Link>
          ))}
        </div>
      )}
      <div className="grid-2">
        <Card>
          <CardHead title={tr("الأعداد المسجّلة", "Recorded counts")} sub={tr("مقارنة بين أحجام السجلات", "Record volumes side by side")} />
          <div className="card-body">
            {counts === null ? <Skeleton lines={4} /> : counts.length === 0 ? <EmptyState compact scene="chart" title={tr("لا توجد أعداد", "No counts")} /> : <Bars items={counts.map((item, index) => ({ label: item.label, value: item.value, tone: tones[index] }))} />}
          </div>
        </Card>
        <Card>
          <CardHead title={tr("أحدث المعلمين", "Latest teachers")} actions={canSee("/teachers") ? <Link className="btn sm ghost" to="/teachers">{tr("الكل", "All")}<IconArrowRight size={16} className="flip-rtl" /></Link> : null} />
          {teachers === null ? <div className="card-body"><Skeleton lines={5} /></div> : teachers.length === 0 ? <EmptyState compact scene="people" title={tr("لا يوجد معلمون بعد", "No teachers yet")} /> : (
            <div className="list">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="list-item">
                  <Avatar name={teacher.firstName} />
                  <div className="li-main"><strong>{teacher.firstName}</strong><small dir="ltr" style={{ textAlign: "start" }}>{teacher.phone}</small></div>
                  <StatusBadge value={teacher.teacherApproved ? "approved" : "waiting"} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Named({ path, title, lede }: { path: string; title: string; lede: string }) {
  const { tr } = useI18n()
  return (
    <Screen lede={lede}>
      <Resource path={path} title={title} createLabel={`${tr("إضافة", "Add")} · ${title}`} columns={[{ key: "name", label: tr("الاسم", "Name") }]} fields={[{ name: "name", label: tr("الاسم", "Name") }]} />
    </Screen>
  )
}

function teacherFields(L: L): Field[] {
  return [
    { name: "firstName", label: L("الاسم", "First name") },
    { name: "lastName", label: L("اللقب", "Last name") },
    { name: "phone", label: L("الهاتف", "Phone") },
    { name: "password", label: L("كلمة المرور", "Password"), type: "password", help: L("ثمانية أحرف على الأقل", "At least 8 characters") },
    { name: "approved", label: L("معتمد", "Approved"), type: "select", options: ["true", "false"], value: "false" },
  ]
}

function scheduleFields(L: L): Field[] {
  return [
    { name: "title", label: L("العنوان", "Title") },
    { name: "body", label: L("النص", "Body"), type: "textarea" },
    { name: "type", label: L("النوع", "Type"), type: "select", options: ["Info", "Ads", "Warning"] },
    { name: "audience", label: L("الجمهور", "Audience"), type: "select", options: ["All", "Teacher", "StudentsWithoutActiveCode", "EducationalGrade", "Gender", "Section"] },
    { name: "nextRunAt", label: L("الموعد", "Next run"), type: "datetime", help: L("يُرسل بصيغة ISO", "Sent as ISO") },
    { name: "repeat", label: L("التكرار", "Repeat"), type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] },
  ]
}

function hourFields(L: L): Field[] {
  return [
    { name: "name", label: L("الاسم", "Name") },
    { name: "monthlyHoursLimit", label: L("ساعات شهرية", "Monthly hours"), type: "number" },
    { name: "validityDays", label: L("الصلاحية بالأيام", "Validity days"), type: "number" },
    { name: "priceIqd", label: "IQD", type: "number" },
    { name: "reportLevel", label: L("التقرير", "Report"), type: "select", options: ["Basic", "Detailed", "Advanced"], value: "Basic" },
    { name: "attendanceEnabled", label: L("علم الحضور مخزّن فقط", "Attendance flag stored only"), type: "select", options: ["true", "false"], value: "true" },
    { name: "exportEnabled", label: L("تصدير", "Export"), type: "select", options: ["true", "false"], value: "false" },
    { name: "isActive", label: L("فعالة", "Active"), type: "select", options: ["true", "false"], value: "true" },
  ]
}

function Institutes() {
  const { tr } = useI18n()
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const { busy, run } = useAction()
  return (
    <Screen lede={tr("المعاهد الشريكة وحساباتها.", "Partner institutes and their accounts.")} actions={<Button variant="primary" icon={IconPlus} onClick={() => setOpen(true)}>{tr("معهد جديد", "New institute")}</Button>}>
      <Resource key={tick} path="/api/admin/institutes" title={tr("المعاهد", "Institutes")} columns={[
        { key: "instituteName", label: tr("المعهد", "Institute"), render: (row) => <PersonCell name={String(row.instituteName ?? "")} /> },
        { key: "phone", label: tr("الهاتف", "Phone"), render: (row) => <Phone value={row.phone} /> },
        { key: "logoFileId", label: tr("الشعار", "Logo"), render: (row) => row.logoFileId ? <span className="badge ok">{tr("مرفوع", "Uploaded")}</span> : <span className="muted">—</span> },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title={tr("معهد جديد", "New institute")} sub={tr("يُنشأ الحساب مع الشعار في طلب واحد.", "The account and logo are created in one request.")} icon={IconBuildingCommunity} tone="purple" size="lg" busy={busy}
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const ok = await run(() => api("/api/admin/institutes", { method: "POST", body: form }), tr("تم حفظ المعهد مع الشعار", "Institute and logo saved"))
          if (ok) { setOpen(false); setTick((value) => value + 1); celebrate() }
        }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{tr("إلغاء", "Cancel")}</Button><Button variant="primary" type="submit" busy={busy}>{tr("إنشاء مع الشعار", "Create with logo")}</Button></>}>
        <div className="form">
          <FormSection step={1} title={tr("المعهد", "Institute")}>
            <Fields>
              <TextField name="instituteName" label={tr("اسم المعهد", "Institute")} required />
              <TextField name="address" label={tr("العنوان", "Address")} optional />
            </Fields>
            <FileDrop name="logo" label={tr("الشعار", "Logo")} accept="image/png,image/jpeg,image/webp" required hint="PNG · JPEG · WEBP" />
          </FormSection>
          <FormSection step={2} title={tr("المسؤول والتواصل", "Contact person")}>
            <Fields>
              <TextField name="firstName" label={tr("الاسم", "First name")} required />
              <TextField name="phone" label={tr("الهاتف", "Phone")} required inputMode="tel" dir="ltr" />
              <TextField name="phone2" label={tr("هاتف ثان", "Second phone")} required inputMode="tel" dir="ltr" />
            </Fields>
          </FormSection>
          <FormSection step={3} title={tr("الدخول", "Sign-in")}>
            <TextField name="password" type="password" label={tr("كلمة المرور", "Password")} required autoComplete="new-password" />
          </FormSection>
        </div>
      </Dialog>
    </Screen>
  )
}

function Subscriptions() {
  const { tr } = useI18n()
  const [userId, setUserId] = useState("")
  const [planId, setPlanId] = useState("")
  const [plans, setPlans] = useState<{ id: string; title: string; priceYearly?: number; codesCount?: number }[] | null>(null)
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const { busy, run } = useAction()
  useEffect(() => {
    api<{ items: { id: string; title: string; priceYearly?: number; codesCount?: number }[] } | { id: string; title: string }[]>("/api/admin/plans?page=1&pageSize=100")
      .then((data) => setPlans(Array.isArray(data) ? data : data.items ?? []))
      .catch(() => setPlans(null))
  }, [])
  return (
    <Screen lede={tr("الاشتراكات السنوية واستهلاك أكوادها.", "Yearly subscriptions and how many of their codes were issued.")} actions={<Button variant="primary" icon={IconCash} onClick={() => setOpen(true)}>{tr("تعيين نقدي", "Assign cash")}</Button>}>
      <Resource key={tick} path="/api/admin/subscriptions" title={tr("الاشتراكات", "Subscriptions")} columns={[
        { key: "status", label: tr("الحالة", "Status") },
        { key: "planCodesCount", label: tr("الأكواد", "Codes"), align: "end" },
        { key: "codesIssued", label: tr("المصدر", "Issued"), render: (row) => typeof row.codesIssued === "number" && typeof row.planCodesCount === "number" ? <Meter used={row.codesIssued} limit={row.planCodesCount} /> : <span className="num">{String(row.codesIssued ?? "—")}</span> },
        { key: "endsAt", label: tr("النهاية", "Ends") },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title={tr("تعيين نقدي", "Assign cash")} sub={tr("يُسجّل دفعة نقدية بالدينار بدون عمولة.", "Records a cash payment in IQD with no commission.")} icon={IconCash} tone="green" busy={busy}
        onSubmit={async (event) => {
          event.preventDefault()
          const ok = await run(() => api("/api/admin/subscriptions", { method: "POST", body: JSON.stringify({ userId, planId }) }), tr("تم تسجيل دفعة نقدية بالدينار بدون عمولة", "Cash payment recorded in IQD with no commission"))
          if (ok) { setOpen(false); setTick((value) => value + 1); celebrate() }
        }}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>{tr("إلغاء", "Cancel")}</Button><Button variant="primary" type="submit" busy={busy}>{tr("تعيين نقدي", "Assign cash")}</Button></>}>
        <div className="form">
          <TextField label={tr("معرف المستخدم", "User id")} value={userId} onChange={(event) => setUserId(event.target.value)} dir="ltr" className="mono" help={tr("معرف حساب المعلم أو المعهد", "The teacher or institute account id")} />
          {plans && plans.length > 0
            ? <Select label={tr("الباقة", "Plan")} value={planId} onChange={setPlanId} options={plans.map((plan) => ({ value: plan.id, label: plan.title, hint: plan.priceYearly != null ? `${plan.priceYearly.toLocaleString()} IQD · ${plan.codesCount ?? "—"}` : undefined }))} />
            : <TextField label={tr("معرف الباقة", "Plan id")} value={planId} onChange={(event) => setPlanId(event.target.value)} dir="ltr" />}
        </div>
      </Dialog>
    </Screen>
  )
}

function Faq() {
  const { tr } = useI18n()
  const [rows, setRows] = useState<{ id: string; question: string; answer: string }[] | null>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const { busy, run } = useAction()
  useEffect(() => { api<{ id: string; question: string; answer: string }[]>("/api/admin/faq").then(setRows).catch(() => setRows([])) }, [])
  return (
    <Screen lede={tr("أسئلة وأجوبة تظهر للمستخدمين بترتيب الإضافة.", "Questions and answers shown to users in the order they were added.")}>
      <div className="with-aside">
        <div>
          {rows === null ? <Card pad><Skeleton lines={5} /></Card> : rows.length === 0 ? <Card><EmptyState scene="search" title={tr("لا توجد أسئلة بعد", "No questions yet")} hint={tr("اكتب أول سؤال من النموذج.", "Write the first question in the form.")} /></Card> : rows.map((row, index) => {
            const open = openId === row.id
            return (
              <div key={row.id} className={open ? "acc open" : "acc"}>
                <button type="button" className="acc-head" aria-expanded={open} onClick={() => setOpenId(open ? null : row.id)}>
                  <span className="index-badge tone-sky">{index + 1}</span>
                  <h3>{row.question}</h3>
                  <IconChevronDown size={20} className="chev" aria-hidden="true" />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div className="acc-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
                      <div className="inner lede" style={{ whiteSpace: "pre-wrap" }}>{row.answer}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
        <aside>
          <Card as="form" onSubmit={async () => {
            const ok = await run(async () => {
              await api("/api/admin/faq", { method: "POST", body: JSON.stringify({ question, answer, sortOrder: rows?.length ?? 0 }) })
              setRows(await api("/api/admin/faq"))
            }, tr("تم النشر", "Published"))
            if (ok) { setQuestion(""); setAnswer("") }
          }}>
            <CardHead title={tr("سؤال جديد", "New question")} icon={IconHelpCircle} tone="sky" />
            <div className="card-body form">
              <TextField label={tr("السؤال", "Question")} value={question} onChange={(event) => setQuestion(event.target.value)} />
              <TextArea label={tr("الجواب", "Answer")} value={answer} onChange={(event) => setAnswer(event.target.value)} />
            </div>
            <div className="card-foot">
              <span className="spacer" />
              <Button variant="primary" type="submit" icon={IconSend} busy={busy}>{tr("نشر", "Publish")}</Button>
            </div>
          </Card>
        </aside>
      </div>
    </Screen>
  )
}

function Notify() {
  const { tr } = useI18n()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sent, setSent] = useState("")
  const { busy, run } = useAction()
  return (
    <Screen lede={tr("إشعار فوري لكل المستخدمين من النوع «معلومة».", "An instant notification to everyone, of type Info.")}>
      <div className="with-aside">
        <Card as="form" onSubmit={async (event) => {
          const target = event.currentTarget
          const message = tr("أُرسل الإشعار إلى الرموز المخزّنة فقط", "Sent only to stored device tokens")
          const ok = await run(() => api("/api/admin/notifications", { method: "POST", body: JSON.stringify({ title, body, type: "Info", audience: "All" }) }), message)
          if (ok) { setSent(message); celebrate(target) }
        }}>
          <CardHead title={tr("إشعار فوري", "Instant notification")} icon={IconBellRinging} tone="yellow" sub={tr("الجمهور: الجميع · النوع: معلومة", "Audience: all · Type: info")} />
          <div className="card-body form">
            <TextField label={tr("العنوان", "Title")} value={title} onChange={(event) => setTitle(event.target.value)} />
            <TextArea label={tr("النص", "Body")} value={body} onChange={(event) => setBody(event.target.value)} />
            {sent ? <Alert tone="info">{sent}</Alert> : null}
          </div>
          <div className="card-foot">
            <span className="spacer" />
            <Button variant="primary" type="submit" icon={IconSend} busy={busy}>{tr("إرسال", "Send")}</Button>
          </div>
        </Card>
        <aside>
          <Card pad>
            <p className="text-3" style={{ marginBottom: 12 }}>{tr("معاينة على الهاتف", "Phone preview")}</p>
            <div className="phone-preview">
              <div className="notch" />
              <div className="push">
                <span className="push-ico"><IconBellRinging size={18} /></span>
                <div style={{ minWidth: 0 }}>
                  <strong>{title || tr("عنوان الإشعار", "Notification title")}</strong>
                  <p>{body || tr("نص الإشعار يظهر هنا.", "The notification text appears here.")}</p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </Screen>
  )
}

function Parameters() {
  const { tr } = useI18n()
  const [key, setKey] = useState("privacy_url")
  const [value, setValue] = useState("")
  const [tick, setTick] = useState(0)
  const save = useAction()
  return (
    <Screen lede={tr("قيم يقرؤها التطبيق، وملف سياسة الخصوصية.", "Values the app reads, and the privacy policy file.")}>
      <Resource key={tick} path="/api/admin/parameters" title={tr("إعدادات النظام", "Parameters")} columns={[
        { key: "key", label: tr("المفتاح", "Key"), render: (row) => <span className="mono" style={{ fontWeight: 600 }}>{String(row.key ?? "")}</span> },
        { key: "value", label: tr("القيمة", "Value"), render: (row) => <span style={{ overflowWrap: "anywhere" }}>{String(row.value ?? "—")}</span> },
      ]} />
      <div className="grid-2">
        <Card as="form" onSubmit={async () => {
          const ok = await save.run(() => api("/api/admin/parameters", { method: "PUT", body: JSON.stringify({ key, value }) }), tr("تم الحفظ", "Saved"))
          if (ok) setTick((n) => n + 1)
        }}>
          <CardHead title={tr("تعيين قيمة", "Set a value")} icon={IconKey} tone="navy" sub={tr("يُنشئ المفتاح أو يحدّثه", "Creates or updates the key")} />
          <div className="card-body form">
            <TextField label={tr("المفتاح", "Key")} value={key} onChange={(event) => setKey(event.target.value)} dir="ltr" />
            <TextField label={tr("القيمة", "Value")} value={value} onChange={(event) => setValue(event.target.value)} />
          </div>
          <div className="card-foot"><span className="spacer" /><Button variant="primary" type="submit" busy={save.busy}>{tr("حفظ", "Save")}</Button></div>
        </Card>
        <PrivacyUpload />
      </div>
    </Screen>
  )
}

function PrivacyUpload() {
  const { tr } = useI18n()
  const [key, setKey] = useState(0)
  const { busy, run } = useAction()
  return (
    <Card as="form" onSubmit={async (event) => {
      const data = new FormData(event.currentTarget)
      if (await run(() => api("/api/admin/privacy", { method: "POST", body: data }), tr("تم رفع الملف", "File uploaded"))) setKey((n) => n + 1)
    }}>
      <CardHead title={tr("ملف الخصوصية", "Privacy PDF")} icon={IconFileTypePdf} tone="coral" />
      <div className="card-body" key={key}><FileDrop name="file" label={tr("الملف", "File")} accept="application/pdf" required hint="PDF" /></div>
      <div className="card-foot"><span className="spacer" /><Button variant="primary" type="submit" busy={busy}>{tr("رفع", "Upload")}</Button></div>
    </Card>
  )
}
