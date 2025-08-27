import { RADIUS } from "../mockData";

export function AlertsTab() {
  const alerts = [
    { type: "Content", student: "Isha", detail: "Potentially inappropriate phrase detected.", time: "8m" },
    { type: "Spam", student: "Neha", detail: "Repeated messages in short time.", time: "12m" },
  ];

  return (
    <div className="space-y-4">
      <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
        <div className="p-4 border-b border-neutral-200">
          <h3 className="font-semibold">Alerts</h3>
        </div>
        <div className="p-4 space-y-3">
          {alerts.map((a, idx) => (
            <div key={idx} className={`flex justify-between items-start border border-neutral-200 ${RADIUS} p-3 bg-white`}>
              <div>
                <div className="font-medium">{a.type} – {a.student}</div>
                <div className="text-sm text-neutral-600">{a.detail}</div>
              </div>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
