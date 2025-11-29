import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../supabase";

export function meta() {
  return [
    { title: "BillDozer - Split Bills Easily" },
    { name: "description", content: "Create a group and start splitting bills instantly." },
  ];
}

export default function Home() {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("groups")
      .insert([{ name: groupName }])
      .select()
      .single();

    if (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
      setLoading(false);
    } else if (data) {
      navigate(`/g/${data.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">BillDozer</h1>
        <p className="text-gray-600 text-center mb-8">Split bills with friends, no account required.</p>

        <form onSubmit={createGroup} className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Trip to Vegas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
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
