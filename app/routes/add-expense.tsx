import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { supabase } from "../supabase";

export default function AddExpense() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [payerName, setPayerName] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch group members
    const [groupMembers, setGroupMembers] = useState<string[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [isCustomPayer, setIsCustomPayer] = useState(false);

    // Split among state
    const [splitAmong, setSplitAmong] = useState<string[]>([]);

    useEffect(() => {
        async function fetchMembers() {
            if (!groupId) return;

            const { data, error } = await supabase
                .from("group_members")
                .select("name")
                .eq("group_id", groupId);

            if (!error && data) {
                const names = data.map(m => m.name).sort();
                setGroupMembers(names);
                // Default: split among everyone
                setSplitAmong(names);

                if (names.length === 0) {
                    setIsCustomPayer(true);
                }
            }
            setLoadingMembers(false);
        }
        fetchMembers();
    }, [groupId]);

    const toggleSplitMember = (name: string) => {
        if (splitAmong.includes(name)) {
            setSplitAmong(splitAmong.filter(n => n !== name));
        } else {
            setSplitAmong([...splitAmong, name]);
        }
    };

    const selectAll = () => {
        setSplitAmong([...groupMembers]);
    };

    const deselectAll = () => {
        setSplitAmong([]);
    };

    const handleCustomPayerBlur = () => {
        // When user finishes typing a new name, add it to members and split list
        const trimmed = payerName.trim();
        if (trimmed && !groupMembers.includes(trimmed)) {
            const updatedMembers = [...groupMembers, trimmed].sort();
            setGroupMembers(updatedMembers);
            // Also add to split list if not already there
            if (!splitAmong.includes(trimmed)) {
                setSplitAmong([...splitAmong, trimmed]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId || !description || !amount || !payerName) return;
        if (splitAmong.length === 0) {
            alert("Please select at least one person to split the expense with.");
            return;
        }

        setLoading(true);

        try {
            // If this is a new member (not in groupMembers), add them to group_members
            if (!groupMembers.includes(payerName)) {
                const { error: memberError } = await supabase
                    .from("group_members")
                    .insert([{
                        group_id: groupId,
                        name: payerName
                    }]);

                if (memberError) throw memberError;
            }

            // Add the expense
            const { error } = await supabase
                .from("expenses")
                .insert([
                    {
                        group_id: groupId,
                        description,
                        amount: parseFloat(amount),
                        payer_name: payerName,
                        split_among: splitAmong,
                    },
                ]);

            if (error) throw error;
            navigate(`/g/${groupId}`);
        } catch (error: any) {
            console.error("Error adding expense:", error);
            alert("Failed to add expense. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
                    <Link to={`/g/${groupId}`} className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Dinner"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (€)
                        </label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="payerName" className="block text-sm font-medium text-gray-700 mb-1">
                            Paid By
                        </label>

                        {loadingMembers ? (
                            <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                        ) : !isCustomPayer && groupMembers.length > 0 ? (
                            <div className="space-y-2">
                                <select
                                    id="payerName"
                                    value={payerName}
                                    onChange={(e) => {
                                        if (e.target.value === "__NEW__") {
                                            setIsCustomPayer(true);
                                            setPayerName("");
                                        } else {
                                            setPayerName(e.target.value);
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                    required
                                >
                                    <option value="" disabled>Select a person</option>
                                    {groupMembers.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                    <option value="__NEW__">+ Add new person...</option>
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    id="payerName"
                                    value={payerName}
                                    onChange={(e) => setPayerName(e.target.value)}
                                    onBlur={handleCustomPayerBlur}
                                    placeholder="Enter name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                    autoFocus={isCustomPayer}
                                />
                                {groupMembers.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomPayer(false)}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Select existing person
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {groupMembers.length > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Split Among
                                </label>
                                <div className="space-x-2">
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAll}
                                        className="text-xs text-gray-600 hover:underline"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>
                            <div className="border border-gray-300 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                                {groupMembers.map(member => (
                                    <label
                                        key={member}
                                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={splitAmong.includes(member)}
                                            onChange={() => toggleSplitMember(member)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{member}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {splitAmong.length} {splitAmong.length === 1 ? 'person' : 'people'} selected
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        ) : (
                            "Add Expense"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
