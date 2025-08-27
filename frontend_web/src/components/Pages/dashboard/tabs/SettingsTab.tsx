import { BRAND_GREEN, RADIUS } from "../mockData";

export function SettingsTab() {
  return (
    <div className="space-y-4">
      <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
        <div className="p-4 border-b border-neutral-200">
          <h3 className="font-semibold">Settings</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Real-time Monitoring</div>
              <div className="text-sm text-neutral-600">Enable live updates via WebSockets</div>
            </div>
            <button 
              className={`px-4 py-2 ${RADIUS} text-white`}
              style={{ backgroundColor: BRAND_GREEN }}
            >
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Data Retention</div>
              <div className="text-sm text-neutral-600">Choose how long to store chat logs</div>
            </div>
            <button className={`px-4 py-2 border border-neutral-200 ${RADIUS} hover:bg-neutral-50`}>
              30 Days
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
