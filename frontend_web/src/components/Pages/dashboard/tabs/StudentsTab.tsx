import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { ChatBubble } from "../ChatBubble";
import { adminApiService } from "../../../../services/adminApi";
import { RADIUS } from "../mockData";

export function StudentsTab() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [recentChat, setRecentChat] = useState<any | null>(null);
  const [recentChatLoading, setRecentChatLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getAllStudents(1, 50);
      setStudents(response.data?.students || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Error loading students: {error}</p>
        <button 
          onClick={fetchStudents}
          className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handler to open modal and fetch recent chat by email
  const handleViewDetails = async (student: any) => {
    setSelectedStudent(student);
    setRecentChatLoading(true);
    setRecentChat(null);
    try {
      const res = await adminApiService.getStudentMostRecentChatByEmail(student.email);
      setRecentChat(res.data || null);
    } catch (e) {
      setRecentChat(null);
    } finally {
      setRecentChatLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`bg-white ${RADIUS} border border-neutral-200 shadow-sm`}>
        <div className="p-4 border-b border-neutral-200">
          <h3 className="font-semibold">Students</h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Course</th>
                  <th className="text-left py-2">Total Chats</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any, idx: number) => (
                  <tr key={student._id || idx} className="border-b border-neutral-100">
                    <td className="py-3 font-medium">{student.name}</td>
                    <td className="py-3">{student.email}</td>
                    <td className="py-3">{student.course}</td>
                    <td className="py-3">{student.totalChats || student.chatCount || 0}</td>
                    {/* Most Recent Chat column removed */}
                    <td className="py-3">
                      {student.isActive ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleViewDetails(student)}
                        className={`px-3 py-1 border border-neutral-200 ${RADIUS} hover:bg-neutral-50 flex items-center gap-2 ml-auto`}
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white ${RADIUS} max-w-3xl w-full max-h-[80vh] flex flex-col`}>
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold">Conversation – {selectedStudent.name}</h3>
              <button 
                onClick={() => { setSelectedStudent(null); setRecentChat(null); }}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-50">
              {/* Show most recent chat preview if available */}
              {recentChatLoading ? (
                <div className="mb-4 italic text-neutral-400">Loading most recent chat…</div>
              ) : recentChat ? (
                <div className="mb-4 p-3 bg-white border border-neutral-200 rounded">
                  <div className="text-xs text-neutral-500 mb-1">Most Recent Chat</div>
                  <div className="font-medium text-neutral-800">
                    {recentChat.firstMessage || recentChat.title || <span className="italic text-neutral-400">No chats</span>}
                  </div>
                  {recentChat.createdAt && (
                    <div className="text-xs text-neutral-400 mt-1">{new Date(recentChat.createdAt).toLocaleString()}</div>
                  )}
                </div>
              ) : (
                <div className="mb-4 italic text-neutral-400">No chats</div>
              )}
              {/* ...existing code for chat bubbles or details... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
