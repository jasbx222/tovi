import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router"
import { api, setToken, type SessionUser } from "../shared/src/api"
import { useI18n } from "../shared/src/i18n"
import { Resource, type Field } from "../shared/src/resource"
import { LoginCard, Shell, type NavItem } from "../shared/src/shell"
import { Area, Callout, CountBars, Field as TextInput, Mast, MetricBand, Welcome } from "../shared/src/ui"

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
    <Shell title={lang === "ar" ? "الإدارة" : "Admin"} items={items}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/teachers" element={<Resource path="/api/admin/teachers" title={lang === "ar" ? "المعلمون" : "Teachers"} columns={[
          { key: "name", label: lang === "ar" ? "الاسم" : "Name", value: (row) => [row.firstName, row.lastName].filter(Boolean).join(" ") },
          { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" },
          { key: "status", label: lang === "ar" ? "الحالة" : "Status" },
          { key: "teacherApproved", label: lang === "ar" ? "الموافقة" : "Approval" },
          { key: "trialEndsAt", label: lang === "ar" ? "نهاية التجربة" : "Trial end" },
          { key: "subscriptionEndsAt", label: lang === "ar" ? "نهاية الاشتراك" : "Subscription end" },
        ]} fields={teacherFields(lang)} />} />
        <Route path="/institutes" element={<Institutes />} />
        <Route path="/students" element={<Resource path="/api/admin/students" title={lang === "ar" ? "الطلاب" : "Students"} columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { key: "status", label: lang === "ar" ? "الحالة" : "Status" }]} />} />
        <Route path="/employees" element={<Resource path="/api/admin/employees" title={lang === "ar" ? "الموظفون" : "Employees"} columns={[{ key: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { key: "employeeStyle", label: lang === "ar" ? "النوع" : "Style" }]} fields={[{ name: "firstName", label: lang === "ar" ? "الاسم" : "Name" }, { name: "lastName", label: lang === "ar" ? "اللقب" : "Last" }, { name: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { name: "password", label: lang === "ar" ? "كلمة المرور" : "Password", type: "password" }, { name: "style", label: "style", type: "select", options: ["Assistant", "Staff"] }]} />} />
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
      <MetricBand items={items.map((item, index) => ({ ...item, lead: index === 0 }))} />
      <div className="board-split">
      <CountBars title={lang === "ar" ? "الأعداد المسجّلة" : "Recorded counts"} items={items} />
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
  return <Resource path={path} title={title} columns={[{ key: "name", label: lang === "ar" ? "الاسم" : "Name" }]} fields={[{ name: "name", label: lang === "ar" ? "الاسم" : "Name" }]} />
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
  const [message, setMessage] = useState("")
  return (
    <div className="space-y-4">
      <Resource path="/api/admin/institutes" title={lang === "ar" ? "المعاهد" : "Institutes"} columns={[{ key: "instituteName", label: lang === "ar" ? "المعهد" : "Institute" }, { key: "phone", label: lang === "ar" ? "الهاتف" : "Phone" }, { key: "logoFileId", label: lang === "ar" ? "الشعار" : "Logo" }]} />
      <form className="sheet form-grid" onSubmit={async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        await api("/api/admin/institutes", { method: "POST", body: form })
        setMessage(lang === "ar" ? "تم حفظ المعهد مع الشعار" : "Institute and logo saved")
      }}>
        <TextInput name="instituteName" label={lang === "ar" ? "اسم المعهد" : "Institute"} required />
        <TextInput name="firstName" label={lang === "ar" ? "الاسم" : "First name"} required />
        <TextInput name="phone" label={lang === "ar" ? "الهاتف" : "Phone"} required />
        <TextInput name="phone2" label={lang === "ar" ? "هاتف ثان" : "Second phone"} required />
        <TextInput name="address" label={lang === "ar" ? "العنوان" : "Address"} />
        <TextInput name="password" type="password" label={lang === "ar" ? "كلمة المرور" : "Password"} required autoComplete="new-password" />
        <label className="field">{lang === "ar" ? "الشعار" : "Logo"}<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
        <button className="btn" type="submit">{lang === "ar" ? "إنشاء مع الشعار" : "Create with logo"}</button>
        {message ? <Callout tone="ok">{message}</Callout> : null}
      </form>
    </div>
  )
}

function Subscriptions() {
  const { lang } = useI18n()
  const [userId, setUserId] = useState("")
  const [planId, setPlanId] = useState("")
  const [message, setMessage] = useState("")
  return (
    <div className="space-y-4">
      <Resource path="/api/admin/subscriptions" title={lang === "ar" ? "الاشتراكات" : "Subscriptions"} columns={[{ key: "status", label: lang === "ar" ? "الحالة" : "Status" }, { key: "planCodesCount", label: lang === "ar" ? "الأكواد" : "Codes" }, { key: "codesIssued", label: lang === "ar" ? "المصدر" : "Issued" }, { key: "endsAt", label: lang === "ar" ? "النهاية" : "Ends" }]} />
      <form className="sheet form-grid" onSubmit={async (event) => {
        event.preventDefault()
        await api("/api/admin/subscriptions", { method: "POST", body: JSON.stringify({ userId, planId }) })
        setMessage(lang === "ar" ? "تم تسجيل دفعة نقدية بالدينار بدون عمولة" : "Cash payment recorded in IQD with no commission")
      }}>
        <TextInput label={lang === "ar" ? "معرف المستخدم" : "User id"} value={userId} onChange={(e) => setUserId(e.target.value)} />
        <TextInput label={lang === "ar" ? "معرف الباقة" : "Plan id"} value={planId} onChange={(e) => setPlanId(e.target.value)} />
        <button className="btn" type="submit">{lang === "ar" ? "تعيين نقدي" : "Assign cash"}</button>
        {message ? <Callout tone="ok">{message}</Callout> : null}
      </form>
    </div>
  )
}

function Faq() {
  const { lang } = useI18n()
  const [rows, setRows] = useState<{ id: string; question: string; answer: string }[]>([])
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  useEffect(() => { api<typeof rows>("/api/admin/faq").then(setRows).catch(() => setRows([])) }, [])
  return (
    <section className="sheet stack">
      <h2 className="display">{lang === "ar" ? "الأسئلة الشائعة" : "FAQ"}</h2>
      {rows.map((row) => <article key={row.id} className="record"><div><h3>{row.question}</h3><p className="lede">{row.answer}</p></div></article>)}
      <form className="stack" onSubmit={async (event) => { event.preventDefault(); await api("/api/admin/faq", { method: "POST", body: JSON.stringify({ question, answer, sortOrder: rows.length }) }); setRows(await api("/api/admin/faq")) }}>
        <TextInput label={lang === "ar" ? "السؤال" : "Question"} value={question} onChange={(e) => setQuestion(e.target.value)} />
        <Area label={lang === "ar" ? "الجواب" : "Answer"} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <button className="btn" type="submit">{lang === "ar" ? "نشر" : "Publish"}</button>
      </form>
    </section>
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
  const [key, setKey] = useState("privacy_url")
  const [value, setValue] = useState("")
  return (
    <div className="space-y-4">
      <Resource path="/api/admin/parameters" title={lang === "ar" ? "إعدادات النظام" : "Parameters"} columns={[{ key: "key", label: lang === "ar" ? "المفتاح" : "Key" }, { key: "value", label: lang === "ar" ? "القيمة" : "Value" }]} />
      <form className="sheet stack" onSubmit={async (event) => { event.preventDefault(); await api("/api/admin/parameters", { method: "PUT", body: JSON.stringify({ key, value }) }) }}>
        <TextInput label={lang === "ar" ? "المفتاح" : "Key"} value={key} onChange={(e) => setKey(e.target.value)} />
        <TextInput label={lang === "ar" ? "القيمة" : "Value"} value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn" type="submit">{lang === "ar" ? "حفظ" : "Save"}</button>
      </form>
      <form className="sheet stack" onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        await api("/api/admin/privacy", { method: "POST", body: data })
      }}>
        <h2>{lang === "ar" ? "ملف الخصوصية" : "Privacy PDF"}</h2>
        <label className="field">{lang === "ar" ? "الملف" : "File"}<input name="file" type="file" accept="application/pdf" required /></label>
        <button className="btn" type="submit">{lang === "ar" ? "رفع" : "Upload"}</button>
      </form>
    </div>
  )
}
