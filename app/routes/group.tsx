import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { supabase } from "../supabase";

interface Expense {
    id: string;
    description: string;
    amount: number;
    payer_name: string;
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchGroupData();
    }, [groupId]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    if (!group) return <div className="p-8 text-center">Group not found</div>;

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const payers = Array.from(new Set(expenses.map(e => e.payer_name)));
    const splitAmount = payers.length > 0 ? totalExpenses / payers.length : 0;

    const calculateSettlements = (): Settlement[] => {
        if (payers.length === 0) return [];

        const balances: Record<string, number> = {};
        payers.forEach(payer => balances[payer] = 0);

        expenses.forEach(expense => {
            if (!balances[expense.payer_name]) balances[expense.payer_name] = 0;
            balances[expense.payer_name] += expense.amount;
        });

        // Subtract fair share
        payers.forEach(payer => {
            balances[payer] -= splitAmount;
        });

        const debtors: { name: string; amount: number }[] = [];
        const creditors: { name: string; amount: number }[] = [];

        Object.entries(balances).forEach(([name, amount]) => {
            if (amount < -0.01) debtors.push({ name, amount }); // Negative balance means they owe money
            if (amount > 0.01) creditors.push({ name, amount }); // Positive balance means they are owed money
        });

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const settlements: Settlement[] = [];
        let i = 0; // debtor index
        let j = 0; // creditor index

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
                        <Link to="/" className="text-sm text-blue-600 hover:underline">Home</Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
                            <p className="text-2xl font-bold text-blue-900">{totalExpenses.toFixed(2)}€</p>
                        </div>
                        {payers.length > 0 && (
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-600 font-medium">Split per Person</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {splitAmount.toFixed(2)}€
                                    <span className="text-xs font-normal text-green-700 ml-1">
                                        ({payers.length} people)
                                    </span>
                                </p>
                            </div>
                        )}
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
                                            <p className="text-sm text-gray-500">Paid by {expense.payer_name}</p>
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
