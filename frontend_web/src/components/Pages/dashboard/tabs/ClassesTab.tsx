import { RADIUS } from "../mockData";

export function ClassesTab() {
  return (
    <div className="space-y-4">
      <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
        <div className="p-4 border-b border-neutral-200">
          <h3 className="font-semibold">Classes</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-neutral-600">
            List, create and manage classes (sections) here. Connect rosters and permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
