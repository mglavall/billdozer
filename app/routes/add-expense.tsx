import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { supabase } from "../supabase";

export default function AddExpense() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [payerName, setPayerName] = useState("");
    const [loading, setLoading] = useState(false);

    // New state for payer selection
    const [existingPayers, setExistingPayers] = useState<string[]>([]);
    const [isCustomPayer, setIsCustomPayer] = useState(false);
    const [loadingPayers, setLoadingPayers] = useState(true);

    // Fetch existing payers on mount
    useState(() => {
        async function fetchPayers() {
            if (!groupId) return;
            const { data, error } = await supabase
                .from("expenses")
                .select("payer_name")
                .eq("group_id", groupId);

            if (!error && data) {
                const uniquePayers = Array.from(new Set(data.map(d => d.payer_name))).sort();
                setExistingPayers(uniquePayers);
                // If we have payers, default to the first one? Or empty?
                // Let's default to empty so they have to choose, or first one if convenient.
                // If no payers, we must use custom input.
                if (uniquePayers.length === 0) {
                    setIsCustomPayer(true);
                }
            }
            setLoadingPayers(false);
        }
        fetchPayers();
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupId || !description || !amount || !payerName) return;

        setLoading(true);
        const { error } = await supabase
            .from("expenses")
            .insert([
                {
                    group_id: groupId,
                    description,
                    amount: parseFloat(amount),
                    payer_name: payerName,
                },
            ]);

        if (error) {
            console.error("Error adding expense:", error);
            alert("Failed to add expense. Please try again.");
            setLoading(false);
        } else {
            navigate(`/g/${groupId}`);
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

                        {loadingPayers ? (
                            <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                        ) : !isCustomPayer && existingPayers.length > 0 ? (
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
                                    {existingPayers.map(p => (
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
                                    placeholder="Enter name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    required
                                    autoFocus={isCustomPayer}
                                />
                                {existingPayers.length > 0 && (
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
