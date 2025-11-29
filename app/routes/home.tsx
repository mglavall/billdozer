import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../supabase";

export default function Home() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [currentMember, setCurrentMember] = useState("");
  const [loading, setLoading] = useState(false);

  const addMember = () => {
    const trimmed = currentMember.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setCurrentMember("");
    }
  };

  const removeMember = (name: string) => {
    setMembers(members.filter(m => m !== name));
  };

  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMember();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    setLoading(true);

    try {
      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert([{ name: groupName }])
        .select();

      if (groupError) throw groupError;
      if (!groupData || !groupData[0]) throw new Error("No group created");

      const groupId = groupData[0].id;

      // Create members if any
      if (members.length > 0) {
        const memberRecords = members.map(name => ({
          group_id: groupId,
          name: name
        }));

        const { error: membersError } = await supabase
          .from("group_members")
          .insert(memberRecords);

        if (membersError) throw membersError;
      }

      navigate(`/g/${groupId}`);
    } catch (error: any) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">BillDozer</h1>
        <p className="text-gray-600 mb-8">Split bills easily with friends</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Weekend Trip"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-2">
              Add Members (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                id="members"
                value={currentMember}
                onChange={(e) => setCurrentMember(e.target.value)}
                onKeyDown={handleMemberKeyDown}
                placeholder="Enter name and press Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={addMember}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {members.map(member => (
                  <span
                    key={member}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {member}
                    <button
                      type="button"
                      onClick={() => removeMember(member)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              "Create Group"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
