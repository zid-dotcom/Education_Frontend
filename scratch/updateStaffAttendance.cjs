const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'BranchAdminStaff.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Calendar to lucide-react imports and import AttendanceCalendarMatrix
const targetImport = `import {
  BookOpen,
  CalendarDays,`;

const replaceImport = `import {
  BookOpen,
  Calendar,
  CalendarDays,`;

const targetImport2 = `import Toast from "../components/common/Toast";`;
const replaceImport2 = `import Toast from "../components/common/Toast";
import AttendanceCalendarMatrix from "../components/common/AttendanceCalendarMatrix";`;

// 2. Add attendanceViewMode state and handleMatrixSaveStatus
const targetState = `  const [statusUpdatingId, setStatusUpdatingId] = useState(null);`;
const replaceState = `  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [attendanceViewMode, setAttendanceViewMode] = useState("calendar");

  const handleMatrixSaveStatus = async (staffId, dateStr, newStatus, existingRecord) => {
    if (!token) return;
    const member = staff.find((s) => s.id === staffId);
    const memberName = member ? member.name : "Staff";
    const cellKey = \`\${staffId}_\${dateStr}\`;
    setAttendanceSaving(cellKey);
    setError("");

    try {
      if (newStatus === null) {
        if (existingRecord) {
          await updateStaffAttendanceApi(existingRecord.id, { status: "Absent" }, token);
          setAttendanceHistory((prev) =>
            prev.map((r) => (r.id === existingRecord.id ? { ...r, status: "Absent" } : r))
          );
        }
        return;
      }

      if (existingRecord) {
        await updateStaffAttendanceApi(existingRecord.id, { status: newStatus }, token);
        setAttendanceHistory((prev) =>
          prev.map((r) => (r.id === existingRecord.id ? { ...r, status: newStatus } : r))
        );
      } else {
        const res = await markStaffAttendanceApi(
          { staff_id: staffId, date: dateStr, status: newStatus },
          token
        );
        const newRecord = res?.attendance || {
          id: Date.now(),
          staff_id: staffId,
          date: dateStr,
          status: newStatus,
        };
        setAttendanceHistory((prev) => [...prev, newRecord]);
      }
      setSuccess(\`\${memberName}'s attendance for \${dateStr} saved as \${newStatus}.\`);
    } catch (err) {
      setError(err.message || "Failed to save staff attendance.");
      throw err;
    } finally {
      setAttendanceSaving(null);
    }
  };`;

// 3. Keep all records in loadAttendanceHistory and call it in useEffect
const targetHistory = `  const loadAttendanceHistory = async () => {
    if (!token) return;
    try {
      setAttendanceLoading(true);
      const data = await getStaffAttendanceApi(token);
      setAttendanceHistory(
        Array.isArray(data?.attendance)
          ? data.attendance.filter((record) => record.status !== "Absent")
          : [],
      );
    } catch (err) {
      setError(err.message || "Failed to load attendance history.");
    } finally {
      setAttendanceLoading(false);
    }
  };`;

const replaceHistory = `  const loadAttendanceHistory = async () => {
    if (!token) return;
    try {
      setAttendanceLoading(true);
      const data = await getStaffAttendanceApi(token);
      setAttendanceHistory(
        Array.isArray(data?.attendance) ? data.attendance : []
      );
    } catch (err) {
      setError(err.message || "Failed to load attendance history.");
    } finally {
      setAttendanceLoading(false);
    }
  };`;

const targetEffect = `  useEffect(() => {
    loadStaff();
    loadAttendance(attendanceDate);
    if (token) {`;

const replaceEffect = `  useEffect(() => {
    loadStaff();
    loadAttendance(attendanceDate);
    loadAttendanceHistory();
    if (token) {`;

// 4. Update the "attendance" active tab view to support Calendar Matrix as default
const targetTabRender = `          {/* ---- Mark attendance ---- */}
          {activeTab === "attendance" && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <h2
                    className="text-xl"
                    style={{ ...serif, fontWeight: 500, color: "#17140f" }}
                  >
                    Mark your branch team
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#8a8175" }}>
                    Recording attendance for{" "}
                    <span style={{ color: "#17140f", fontWeight: 500 }}>
                      {formatAttendanceDate(attendanceDate)}
                    </span>
                    .
                  </p>
                </div>
                <label
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
                  style={{ border: "1px solid #e3ddd0", color: "#5b5346" }}
                >
                  <CalendarDays className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                  <span className="sr-only">Attendance date</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    max={getToday()}
                    onChange={handleAttendanceDateChange}
                    className="bg-transparent outline-none"
                  />
                </label>
              </div>`;

const replaceTabRender = `          {/* ---- Mark attendance ---- */}
          {activeTab === "attendance" && (
            <section className="space-y-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <h2
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                    style={{ ...serif, fontWeight: 600, color: "#17140f" }}
                  >
                    Branch Staff Attendance
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Track and mark your branch team's monthly attendance in interactive calendar format.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-[#e3ddd0] bg-white p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode("calendar")}
                    className={\`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer \${
                      attendanceViewMode === "calendar"
                        ? "bg-[#17140f] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-[#faf8f4]"
                    }\`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Calendar Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode("daily")}
                    className={\`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer \${
                      attendanceViewMode === "daily"
                        ? "bg-[#17140f] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-[#faf8f4]"
                    }\`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Single Day
                  </button>
                </div>
              </div>

              {attendanceViewMode === "calendar" ? (
                <AttendanceCalendarMatrix
                  people={staff}
                  records={attendanceHistory}
                  onSaveStatus={handleMatrixSaveStatus}
                  title="Branch Staff"
                  subtitle={\`\${staff.length} staff accounts\`}
                  savingKey={attendanceSaving}
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center rounded-2xl border border-[#e3ddd0] bg-white p-5">
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Single Date Mode</p>
                      <p className="text-base font-bold text-slate-900">
                        Recording attendance for {formatAttendanceDate(attendanceDate)}
                      </p>
                    </div>
                    <label
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                      style={{ border: "1px solid #e3ddd0", color: "#5b5346" }}
                    >
                      <CalendarDays className="h-4 w-4" style={{ color: "#9c6b2e" }} />
                      <input
                        type="date"
                        value={attendanceDate}
                        max={getToday()}
                        onChange={handleAttendanceDateChange}
                        className="bg-transparent outline-none"
                      />
                    </label>
                  </div>`;

// And close the daily conditional block at the end of the attendance card
const targetTabEnd = `                    <div className="p-5" style={{ borderTop: "1px solid #efe9dd" }}>
                      <button
                        type="button"
                        onClick={markAllPresent}
                        className={\`rounded-lg px-4 py-2 text-xs font-medium transition-colors \${FOCUS_RING}\`}
                        style={{ background: "#eef2ea", color: "#39533a" }}
                      >
                        Mark all present
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}`;

const replaceTabEnd = `                    <div className="p-5" style={{ borderTop: "1px solid #efe9dd" }}>
                      <button
                        type="button"
                        onClick={markAllPresent}
                        className={\`rounded-lg px-4 py-2 text-xs font-medium transition-colors \${FOCUS_RING}\`}
                        style={{ background: "#eef2ea", color: "#39533a" }}
                      >
                        Mark all present
                      </button>
                    </div>
                  </div>
                )}
              </div>
                </div>
              )}
            </section>
          )}`;

const normalize = str => str.replace(/\r\n/g, '\n');

let normalized = normalize(content);

if (normalized.includes(normalize(targetImport))) {
  normalized = normalized.replace(normalize(targetImport), normalize(replaceImport));
  console.log('Applied 1: Import Calendar');
} else {
  console.error('Target 1 not found');
}

if (normalized.includes(normalize(targetImport2))) {
  normalized = normalized.replace(normalize(targetImport2), normalize(replaceImport2));
  console.log('Applied 2: Import AttendanceCalendarMatrix');
} else {
  console.error('Target 2 not found');
}

if (normalized.includes(normalize(targetState))) {
  normalized = normalized.replace(normalize(targetState), normalize(replaceState));
  console.log('Applied 3: State & handleMatrixSaveStatus');
} else {
  console.error('Target 3 not found');
}

if (normalized.includes(normalize(targetHistory))) {
  normalized = normalized.replace(normalize(targetHistory), normalize(replaceHistory));
  console.log('Applied 4: loadAttendanceHistory keep all');
} else {
  console.error('Target 4 not found');
}

if (normalized.includes(normalize(targetEffect))) {
  normalized = normalized.replace(normalize(targetEffect), normalize(replaceEffect));
  console.log('Applied 5: loadAttendanceHistory on mount');
} else {
  console.error('Target 5 not found');
}

if (normalized.includes(normalize(targetTabRender))) {
  normalized = normalized.replace(normalize(targetTabRender), normalize(replaceTabRender));
  console.log('Applied 6: Tab render with AttendanceCalendarMatrix');
} else {
  console.error('Target 6 not found');
}

if (normalized.includes(normalize(targetTabEnd))) {
  normalized = normalized.replace(normalize(targetTabEnd), normalize(replaceTabEnd));
  console.log('Applied 7: Tab end closing div');
} else {
  console.error('Target 7 not found');
}

fs.writeFileSync(filePath, normalized, 'utf8');
console.log('BranchAdminStaff.jsx successfully updated!');

