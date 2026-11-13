import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router"
import { api, setToken, type SessionUser } from "../shared/src/api"
import { useI18n } from "../shared/src/i18n"
import { Resource, type Field } from "../shared/src/resource"
import { LoginCard, Shell, type NavItem } from "../shared/src/shell"
import { StatGrid } from "../shared/src/stats"
import { Area, Callout, CountBars, Field as TextInput, Welcome } from "../shared/src/ui"
import { CountChart } from "../shared/src/charts"
import { FormModal, useToast } from "../shared/src/crud"
import { useLookupLabels, personLookup, type LookupConfig } from "../shared/src/lookup"

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
  const { lang } = useI18n()
  return <LoginCard title={lang === "ar" ? "لوحة مدير النظام" : "Super admin"} onSubmit={async (phone, password) => {
    const result = await api<{ token: string }>("/api/auth/admin/login", { method: "POST", body: JSON.stringify({ phone, password }) })
    setToken(result.token)
    navigate("/")
  }} />
}

function Frame() {
  const [me, setMe] = useState<SessionUser | null>(null)
  const navigate = useNavigate()
  const { lang } = useI18n()
  useEffect(() => {
    api<SessionUser>("/api/auth/me").then(setMe).catch(() => navigate("/login"))
  }, [navigate])
  if (!me) return null
  const items = nav.filter((item) => !item.permission || me.permissions.includes(item.permission))
  return (
    <Shell title={lang === "ar" ? "الإدارة" : "Admin"} items={items} user={{ name: me.name, phone: me.phone, instituteName: me.instituteName }} notifyTo="/notifications">
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/teachers" element={<Resource path="/api/admin/teachers" title={lang === "ar" ? "المعلمون" : "Teachers"} update image="photoFileId" columns={[
          { key: "name", label: lang === "ar" ? "الاسم" : "Name", value: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") },
          { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" },
          { key: "status", label: lang === "ar" ? "الحالة" : "Status" },
          { key: "teacherApproved", label: lang === "ar" ? "الموافقة" : "Approval" },
          { key: "trialEndsAt", label: lang === "ar" ? "نهاية التجربة" : "Trial end" },
          { key: "subscriptionEndsAt", label: lang === "ar" ? "نهاية الاشتراك" : "Subscription end" },
        ]} fields={teacherFields(lang)} />} />
        <Route path="/institutes" element={<Institutes />} />
        <Route path="/students" element={<Resource path="/api/admin/students" title={lang === "ar" ? "الطلاب" : "Students"} image="photoFileId" columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name", value: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { key: "status", label: lang === "ar" ? "الحالة" : "Status" }, { key: "xp", label: lang === "ar" ? "النقاط" : "XP" }, { key: "streak", label: lang === "ar" ? "السلسلة (يوم)" : "Streak (days)" }]} />} />
        <Route path="/employees" element={<Resource path="/api/admin/employees" title={lang === "ar" ? "الموظفون" : "Employees"} columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { key: "employeeStyle", label: lang === "ar" ? "النوع" : "Style" }]} fields={[{ name: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { name: "lastName", label: lang === "ar" ? "اللقب" : "Last" }, { name: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { name: "password", label: lang === "ar" ? "كلمة المرور" : "Password", type: "password", optionalOnEdit: true }, { name: "style", label: "style", type: "select", options: ["Assistant", "Staff"] }]} />} />
        <Route path="/sections" element={<Named path="/api/admin/sections" title={lang === "ar" ? "الأقسام" : "Sections"} />} />
        <Route path="/grades" element={<Named path="/api/admin/grades" title={lang === "ar" ? "المراحل" : "Grades"} />} />
        <Route path="/subjects" element={<Named path="/api/admin/subjects" title={lang === "ar" ? "المواد" : "Subjects"} />} />
        <Route path="/domains" element={<Named path="/api/admin/learning-domains" title={lang === "ar" ? "المجالات" : "Domains"} />} />
        <Route path="/governorates" element={<Named path="/api/admin/governorates" title={lang === "ar" ? "المحافظات" : "Governorates"} />} />
        <Route path="/plans" element={<Resource path="/api/admin/plans" title={lang === "ar" ? "الباقات" : "Plans"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }, { key: "audience", label: lang === "ar" ? "النوع" : "Type" }, { key: "priceYearly", label: "IQD" }, { key: "codesCount", label: lang === "ar" ? "الأكواد" : "Codes" }]} fields={[{ name: "title", label: lang === "ar" ? "العنوان" : "Title" }, { name: "description", label: lang === "ar" ? "الوصف" : "Description" }, { name: "audience", label: lang === "ar" ? "النوع" : "Type", type: "select", options: ["ForTeacher", "ForInstitute"] }, { name: "priceYearly", label: "IQD", type: "number" }, { name: "codesCount", label: lang === "ar" ? "عدد الأكواد" : "Codes", type: "number" }]} />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/invoices" element={<Resource path="/api/admin/invoices" title={lang === "ar" ? "الفواتير" : "Invoices"} columns={[{ key: "amountIqd", label: "IQD" }, { key: "activatedCodesCount", label: lang === "ar" ? "أكواد مفعّلة" : "Activated codes" }, { key: "note", label: lang === "ar" ? "ملاحظة" : "Note" }]} fields={[{ name: "partyUserId", label: lang === "ar" ? "معرف الجهة" : "Party id" }, { name: "amountIqd", label: "IQD", type: "number" }, { name: "activatedCodesCount", label: lang === "ar" ? "عدد الأكواد" : "Codes", type: "number" }, { name: "note", label: lang === "ar" ? "ملاحظة" : "Note" }]} />} />
        <Route path="/codes" element={<Resource path="/api/admin/codes" title={lang === "ar" ? "الأكواد" : "Codes"} columns={[{ key: "code", label: lang === "ar" ? "الكود" : "Code" }, { key: "status", label: lang === "ar" ? "الحالة" : "Status" }, { key: "targetType", label: lang === "ar" ? "الهدف" : "Target" }, { key: "expiresAt", label: lang === "ar" ? "الانتهاء" : "Expires" }]} />} />
        <Route path="/ads" element={<Resource path="/api/admin/advertisements" title={lang === "ar" ? "الإعلانات" : "Ads"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }, { key: "active", label: lang === "ar" ? "ظاهر" : "Active" }]} fields={[{ name: "title", label: lang === "ar" ? "العنوان" : "Title" }, { name: "body", label: lang === "ar" ? "النص" : "Body" }, { name: "linkUrl", label: lang === "ar" ? "الرابط" : "Link" }]} />} />
        <Route path="/guides" element={<Resource path="/api/admin/guides" title={lang === "ar" ? "الأدلة" : "Guides"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }]} fields={[{ name: "title", label: lang === "ar" ? "العنوان" : "Title" }, { name: "body", label: lang === "ar" ? "النص" : "Body" }]} />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/notifications" element={<Notify />} />
        <Route path="/scheduled" element={<Resource path="/api/admin/scheduled-notifications" title={lang === "ar" ? "المجدولة" : "Scheduled"} columns={[{ key: "title", label: lang === "ar" ? "العنوان" : "Title" }, { key: "audience", label: lang === "ar" ? "الجمهور" : "Audience" }, { key: "repeat", label: lang === "ar" ? "التكرار" : "Repeat" }, { key: "nextRunAt", label: lang === "ar" ? "الموعد" : "Next" }]} fields={scheduleFields(lang)} />} />
        <Route path="/parameters" element={<Parameters />} />
        <Route path="/reports" element={<Resource path="/api/admin/reports/codes" title={lang === "ar" ? "تقارير الأكواد" : "Code reports"} columns={[{ key: "code", label: lang === "ar" ? "الكود" : "Code" }, { key: "status", label: lang === "ar" ? "الحالة" : "Status" }, { key: "ownerUserId", label: lang === "ar" ? "المالك" : "Owner" }]} />} />
        <Route path="/hours" element={<Resource path="/api/admin/hour-packages" title={lang === "ar" ? "باقات الساعات" : "Hour packages"} columns={[{ key: "name", label: lang === "ar" ? "الاسم" : "Name" }, { key: "monthlyHoursLimit", label: lang === "ar" ? "الساعات" : "Hours" }, { key: "monthlyMinutesLimit", label: lang === "ar" ? "الدقائق" : "Minutes" }, { key: "attendanceEnabled", label: lang === "ar" ? "علم الحضور" : "Attendance flag" }]} fields={hourFields(lang)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

function Overview() {
  const { lang } = useI18n()
  const [items, setItems] = useState<{ label: string; value: number }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; firstName: string; phone: string; teacherApproved?: boolean }[]>([])
  const [error, setError] = useState("")
  useEffect(() => {
    const sources = [
      ["/api/admin/teachers", lang === "ar" ? "المعلمون" : "Teachers"],
      ["/api/admin/students", lang === "ar" ? "الطلاب" : "Students"],
      ["/api/admin/institutes", lang === "ar" ? "المعاهد" : "Institutes"],
      ["/api/admin/codes", lang === "ar" ? "الأكواد" : "Codes"],
    ]
    Promise.all(sources.map(async ([path, label]) => {
      try {
        const page = await api<{ total: number }>(`${path}?page=1&pageSize=1`)
        return { label, value: page.total }
      } catch { return null }
    })).then((rows) => setItems(rows.filter((row): row is { label: string; value: number } => row !== null)))
      .catch((reason) => setError(reason.message))
    api<{ items: { id: string; firstName: string; phone: string; teacherApproved?: boolean }[] }>("/api/admin/teachers?page=1&pageSize=5")
      .then((page) => setTeachers(page.items ?? []))
      .catch(() => setTeachers([]))
  }, [lang])
  return (
    <div className="board">
      <Welcome title={lang === "ar" ? "أهلاً بعودتك" : "Welcome back"} lede={lang === "ar" ? "الأعداد من الواجهة البرمجية، بلا تقدير." : "Counts come from the API."} />
      {error ? <Callout tone="bad">{error}</Callout> : null}
      <StatGrid items={items.map((item, index) => ({ ...item, icon: (["people", "student", "building", "ticket"] as const)[index] ?? "book", tone: (["violet", "sun", "mint", "coral"] as const)[index] ?? "sky" }))} />
      <div className="board-split">
      <CountChart title={lang === "ar" ? "الأعداد المسجّلة" : "Recorded counts"} items={items} />
      <section className="panel">
        <div className="toolbar"><h2>{lang === "ar" ? "أحدث المعلمين" : "Latest teachers"}</h2></div>
        <table className="data">
          <thead><tr><th>{lang === "ar" ? "الاسم" : "Name"}</th><th>{lang === "ar" ? "الهاتف" : "Phone"}</th><th>{lang === "ar" ? "الاعتماد" : "Approval"}</th></tr></thead>
          <tbody>
            {teachers.length === 0 ? <tr><td colSpan={3}><div className="empty"><i />{lang === "ar" ? "لا يوجد معلمون بعد" : "No teachers yet"}</div></td></tr> : teachers.map((teacher) => (
              <tr key={teacher.id}><td>{teacher.firstName}</td><td>{teacher.phone}</td><td><span className={teacher.teacherApproved ? "pill ok" : "pill wait"}>{teacher.teacherApproved ? (lang === "ar" ? "معتمد" : "Approved") : (lang === "ar" ? "بانتظار" : "Waiting")}</span></td></tr>
            ))}
          </tbody>
        </table>
      </section>
      </div>
    </div>
  )
}

function Named({ path, title }: { path: string; title: string }) {
  const { lang } = useI18n()
  return <Resource path={path} title={title} update remove columns={[{ key: "name", label: lang === "ar" ? "الاسم" : "Name" }]} fields={[{ name: "name", label: lang === "ar" ? "الاسم" : "Name", required: true }]} />
}

function teacherFields(lang: string): Field[] {
  return [
    { name: "firstName", label: lang === "ar" ? "الاسم" : "First name" },
    { name: "lastName", label: lang === "ar" ? "اللقب" : "Last name" },
    { name: "phone", label: lang === "ar" ? "الهاتف" : "Phone" },
    { name: "password", label: lang === "ar" ? "كلمة المرور" : "Password", type: "password" },
    { name: "approved", label: lang === "ar" ? "معتمد" : "Approved", type: "select", options: ["true", "false"], value: "false" },
  ]
}

function scheduleFields(lang: string): Field[] {
  return [
    { name: "title", label: lang === "ar" ? "العنوان" : "Title" },
    { name: "body", label: lang === "ar" ? "النص" : "Body" },
    { name: "type", label: lang === "ar" ? "النوع" : "Type", type: "select", options: ["Info", "Ads", "Warning"] },
    { name: "audience", label: lang === "ar" ? "الجمهور" : "Audience", type: "select", options: ["All", "Teacher", "StudentsWithoutActiveCode", "EducationalGrade", "Gender", "Section"] },
    { name: "nextRunAt", label: lang === "ar" ? "الموعد ISO" : "Next run ISO" },
    { name: "repeat", label: lang === "ar" ? "التكرار" : "Repeat", type: "select", options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"] },
  ]
}

function hourFields(lang: string): Field[] {
  return [
    { name: "name", label: lang === "ar" ? "الاسم" : "Name" },
    { name: "monthlyHoursLimit", label: lang === "ar" ? "ساعات شهرية" : "Monthly hours", type: "number" },
    { name: "validityDays", label: lang === "ar" ? "الصلاحية بالأيام" : "Validity days", type: "number" },
    { name: "priceIqd", label: "IQD", type: "number" },
    { name: "reportLevel", label: lang === "ar" ? "التقرير" : "Report", type: "select", options: ["Basic", "Detailed", "Advanced"], value: "Basic" },
    { name: "attendanceEnabled", label: lang === "ar" ? "علم الحضور مخزّن فقط" : "Attendance flag stored only", type: "select", options: ["true", "false"], value: "true" },
    { name: "exportEnabled", label: lang === "ar" ? "تصدير" : "Export", type: "select", options: ["true", "false"], value: "false" },
    { name: "isActive", label: lang === "ar" ? "فعالة" : "Active", type: "select", options: ["true", "false"], value: "true" },
  ]
}

function Institutes() {
  const { lang } = useI18n()
  return (
    <Resource
      path="/api/admin/institutes"
      title={lang === "ar" ? "المعاهد" : "Institutes"}
      image="logoFileId"
      update
      multipart
      columns={[
        { key: "instituteName", label: lang === "ar" ? "المعهد" : "Institute" },
        { key: "firstName", label: lang === "ar" ? "المسؤول" : "Manager" },
        { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" },
        { key: "status", label: lang === "ar" ? "الحالة" : "Status" },
      ]}
      fields={[
        { name: "instituteName", label: lang === "ar" ? "اسم المعهد" : "Institute", required: true },
        { name: "firstName", label: lang === "ar" ? "الاسم" : "First name", required: true },
        { name: "phone", label: lang === "ar" ? "الهاتف" : "Phone", type: "tel", required: true, optionalOnEdit: true, hint: lang === "ar" ? "مثال: 07xxxxxxxx" : "Example: 07xxxxxxxx" },
        { name: "phone2", label: lang === "ar" ? "هاتف ثان" : "Second phone", type: "tel", required: true, optionalOnEdit: true },
        { name: "address", label: lang === "ar" ? "العنوان" : "Address" },
        { name: "password", label: lang === "ar" ? "كلمة المرور" : "Password", type: "password", required: true, optionalOnEdit: true },
        { name: "logo", label: lang === "ar" ? "الشعار" : "Logo", type: "file", required: true, optionalOnEdit: true },
      ]}
    />
  )
}

function personName(row: Record<string, unknown>) {
  return [row.firstName, row.lastName, row.instituteName].filter(Boolean).join(" ").trim() || String(row.phone ?? "")
}

function Subscriptions() {
  const { lang } = useI18n()
  const ar = lang === "ar"
  const teacherOf = useLookupLabels("/api/admin/teachers", personName)
  const instituteOf = useLookupLabels("/api/admin/institutes", (row) => String(row.instituteName || personName(row)))
  const planOf = useLookupLabels("/api/admin/plans", (row) => String(row.title ?? ""))
  const planLookup: LookupConfig = {
    path: "/api/admin/plans",
    queryParam: false,
    filter: (row) => String(row.audience) === "ForTeacher",
    labelOf: (row) => String(row.title ?? ""),
    hintOf: (row) => {
      const price = row.priceYearly == null ? "" : `${Number(row.priceYearly).toLocaleString(ar ? "ar-IQ" : "en-GB")} IQD`
      const codes = row.codesCount == null ? "" : (ar ? `${row.codesCount} أكواد · سنة` : `${row.codesCount} codes · 1 year`)
      return [price, codes].filter(Boolean).join(" · ")
    },
    placeholder: ar ? "اختر الباقة" : "Choose a plan",
    searchHint: ar ? "ابحث عن الباقة" : "Search plans",
    pageSize: 100,
  }
  return (
    <Resource
      path="/api/admin/subscriptions"
      title={ar ? "الاشتراكات" : "Subscriptions"}
      formTitle={(mode) => mode === "edit" ? (ar ? "تعديل اشتراك" : "Edit subscription") : (ar ? "إضافة اشتراك" : "Add subscription")}
      columns={[
        { key: "userId", label: ar ? "المعلم" : "Teacher", value: (row) => { const name = teacherOf(row.userId); return name === "—" ? instituteOf(row.userId) : name } },
        { key: "planId", label: ar ? "الباقة" : "Plan", value: (row) => planOf(row.planId) },
        { key: "status", label: ar ? "الحالة" : "Status" },
        { key: "planCodesCount", label: ar ? "الأكواد" : "Codes" },
        { key: "codesIssued", label: ar ? "المصدر" : "Issued" },
        { key: "endsAt", label: ar ? "النهاية" : "Ends" },
      ]}
      fields={[
        { name: "userId", label: ar ? "المعلم" : "Teacher", type: "lookup", required: true, lookup: personLookup("/api/admin/teachers", lang, { ar: "المعلم", en: "teacher" }) },
        { name: "planId", label: ar ? "الباقة" : "Plan", type: "lookup", required: true, lookup: planLookup },
      ]}
    />
  )
}

function Faq() {
  const { lang } = useI18n()
  return (
    <Resource
      path="/api/admin/faq"
      title={lang === "ar" ? "الأسئلة الشائعة" : "FAQ"}
      columns={[
        { key: "question", label: lang === "ar" ? "السؤال" : "Question" },
        { key: "answer", label: lang === "ar" ? "الجواب" : "Answer" },
      ]}
      fields={[
        { name: "question", label: lang === "ar" ? "السؤال" : "Question", required: true },
        { name: "answer", label: lang === "ar" ? "الجواب" : "Answer", type: "textarea", required: true },
        { name: "sortOrder", label: lang === "ar" ? "الترتيب" : "Order", type: "number", value: "0" },
      ]}
    />
  )
}

function Notify() {
  const { lang } = useI18n()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [message, setMessage] = useState("")
  return (
    <form className="sheet stack" style={{ maxWidth: 640 }} onSubmit={async (event) => {
      event.preventDefault()
      await api("/api/admin/notifications", { method: "POST", body: JSON.stringify({ title, body, type: "Info", audience: "All" }) })
      setMessage(lang === "ar" ? "أُرسل الإشعار إلى الرموز المخزّنة فقط" : "Sent only to stored device tokens")
    }}>
      <h2 className="display">{lang === "ar" ? "إشعار فوري" : "Instant notification"}</h2>
      <TextInput label={lang === "ar" ? "العنوان" : "Title"} value={title} onChange={(e) => setTitle(e.target.value)} />
      <Area label={lang === "ar" ? "النص" : "Body"} value={body} onChange={(e) => setBody(e.target.value)} />
      <button className="btn" type="submit">{lang === "ar" ? "إرسال" : "Send"}</button>
      {message ? <Callout>{message}</Callout> : null}
    </form>
  )
}

function Parameters() {
  const { lang } = useI18n()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [file, setFile] = useState<File | null>(null)
  return (
    <div className="stack">
      <Resource
        path="/api/admin/parameters"
        title={lang === "ar" ? "إعدادات النظام" : "Parameters"}
        columns={[{ key: "key", label: lang === "ar" ? "المفتاح" : "Key" }, { key: "value", label: lang === "ar" ? "القيمة" : "Value" }]}
        fields={[{ name: "key", label: lang === "ar" ? "المفتاح" : "Key", required: true }, { name: "value", label: lang === "ar" ? "القيمة" : "Value", required: true }]}
        submit={async ({ payload }) => { await api("/api/admin/parameters", { method: "PUT", body: payload instanceof FormData ? payload : JSON.stringify(payload) }) }}
      />
      <div className="crud-head">
        <div><h2>{lang === "ar" ? "ملف الخصوصية" : "Privacy PDF"}</h2></div>
        <button className="btn" type="button" onClick={() => { setError(""); setOpen(true) }}>{lang === "ar" ? "رفع ملف" : "Upload file"}</button>
      </div>
      <FormModal open={open} title={lang === "ar" ? "رفع ملف الخصوصية" : "Upload privacy PDF"} onClose={() => setOpen(false)} busy={busy} error={error} submitLabel={lang === "ar" ? "رفع" : "Upload"} onSubmit={async () => {
        if (!file) { setError(lang === "ar" ? "اختر ملفاً" : "Choose a file"); return }
        setBusy(true)
        try {
          const data = new FormData()
          data.append("file", file)
          await api("/api/admin/privacy", { method: "POST", body: data })
          setOpen(false)
          toast.push(lang === "ar" ? "تم رفع الملف" : "File uploaded")
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "")
        } finally { setBusy(false) }
      }}>
        <label className="dropzone">
          <span className="dropzone-label">{lang === "ar" ? "ملف PDF" : "PDF file"}</span>
          <input className="sr-only" type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <span className="dropzone-box"><i className="dropzone-plus" /><span><strong>{file ? file.name : (lang === "ar" ? "اضغط لاختيار الملف" : "Click to choose a file")}</strong></span></span>
        </label>
      </FormModal>
    </div>
  )
}
