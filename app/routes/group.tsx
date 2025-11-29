import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { supabase } from "../supabase";

interface Expense {
    id: string;
    description: string;
    amount: number;
    payer_name: string;
    split_among: string[] | null;
    created_at: string;
}

interface Group {
    id: string;
    name: string;
}

interface Settlement {
    from: string;
    to: string;
    amount: number;
}

export default function GroupView() {
    const { groupId } = useParams();
    const [group, setGroup] = useState<Group | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [groupMembers, setGroupMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchGroupData() {
            if (!groupId) return;

            try {
                // Fetch group details
                const { data: groupData, error: groupError } = await supabase
                    .from("groups")
                    .select("*")
                    .eq("id", groupId)
                    .single();

                if (groupError) throw groupError;
                setGroup(groupData);

                // Fetch expenses
                const { data: expensesData, error: expensesError } = await supabase
                    .from("expenses")
                    .select("*")
                    .eq("group_id", groupId)
                    .order("created_at", { ascending: false });

                if (expensesError) throw expensesError;
                setExpenses(expensesData || []);

                // Fetch group members
                const { data: membersData, error: membersError } = await supabase
                    .from("group_members")
                    .select("name")
                    .eq("group_id", groupId);

                if (membersError) throw membersError;
                setGroupMembers(membersData?.map(m => m.name) || []);
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGroupData();
    }, [groupId]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!group) return <div className="p-8 text-center">Group not found</div>;

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Get all people involved (from members or inferred from expenses)
    const allPeople = groupMembers.length > 0
        ? groupMembers
        : Array.from(new Set(expenses.map(e => e.payer_name)));

    const splitAmount = allPeople.length > 0 ? totalExpenses / allPeople.length : 0;

    const calculateSettlements = (): Settlement[] => {
        if (allPeople.length === 0) return [];

        const balances: Record<string, number> = {};
        allPeople.forEach(person => balances[person] = 0);

        expenses.forEach(expense => {
            // Determine who splits this expense
            const splitWith = expense.split_among && expense.split_among.length > 0
                ? expense.split_among
                : allPeople; // Default to everyone if not specified

            const sharePerPerson = expense.amount / splitWith.length;

            // Payer gets credited
            if (!balances[expense.payer_name]) balances[expense.payer_name] = 0;
            balances[expense.payer_name] += expense.amount;

            // Each person in split_among gets debited
            splitWith.forEach(person => {
                if (!balances[person]) balances[person] = 0;
                balances[person] -= sharePerPerson;
            });
        });

        const debtors: { name: string; amount: number }[] = [];
        const creditors: { name: string; amount: number }[] = [];

        Object.entries(balances).forEach(([name, amount]) => {
            if (amount < -0.01) debtors.push({ name, amount });
            if (amount > 0.01) creditors.push({ name, amount });
        });

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const settlements: Settlement[] = [];
        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

            settlements.push({
                from: debtor.name,
                to: creditor.name,
                amount: amount
            });

            debtor.amount += amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        return settlements;
    };

    const settlements = calculateSettlements();

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                        <button
                            onClick={copyToClipboard}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <span className="text-green-600 font-bold">✓ Copied!</span>
                                </>
                            ) : (
                                <>
                                    <span>Share Group</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>


                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
                        <p className="text-2xl font-bold text-blue-900">{totalExpenses.toFixed(2)}€</p>
                    </div>


                    {settlements.length > 0 && (
                        <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Settlements</h3>
                            <ul className="space-y-2">
                                {settlements.map((s, idx) => (
                                    <li key={idx} className="flex items-center text-yellow-800">
                                        <span className="font-medium">{s.from}</span>
                                        <span className="mx-2 text-yellow-600">owes</span>
                                        <span className="font-medium">{s.to}</span>
                                        <span className="ml-auto font-bold">{s.amount.toFixed(2)}€</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            Share this URL with friends to add expenses.
                        </p>
                        <Link
                            to={`/g/${groupId}/add`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Add Expense
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <h2 className="text-lg font-semibold p-6 border-b border-gray-100">Expenses</h2>
                    {expenses.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No expenses yet. Add one to get started!
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {expenses.map((expense) => (
                                <li key={expense.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900">{expense.description}</p>
                                            <p className="text-sm text-gray-500">
                                                Paid by {expense.payer_name}
                                                {expense.split_among && expense.split_among.length > 0 && (
                                                    <span className="text-gray-400"> • Split among {expense.split_among.length} {expense.split_among.length === 1 ? 'person' : 'people'}</span>
                                                )}
                                            </p>
                                        </div>
                                        <span className="font-bold text-gray-900">{expense.amount.toFixed(2)}€</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
