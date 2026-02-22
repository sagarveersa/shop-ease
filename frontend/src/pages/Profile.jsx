import {
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { Navbar } from "../components/Navbar";

const profile = {
  name: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  phone: "+1 (555) 019-2234",
  memberSince: "March 2023",
  tier: "Gold Member",
};

const stats = [
  { label: "Total Orders", value: "48", icon: Package },
  { label: "Cart Items", value: "19", icon: Star },
  { label: "Saved Cards", value: "2", icon: CreditCard },
  { label: "Loyalty Points", value: "2,340", icon: ShieldCheck },
];

const addresses = [
  {
    type: "Home",
    line1: "214 Willow Street",
    line2: "San Jose, CA 95112",
    primary: true,
  },
  {
    type: "Work",
    line1: "88 Market Ave, Suite 403",
    line2: "San Francisco, CA 94103",
    primary: false,
  },
];

const payments = [
  { brand: "Visa", last4: "4242", expiry: "09/28", primary: true },
  { brand: "Mastercard", last4: "1178", expiry: "02/27", primary: false },
];

const recentOrders = [
  {
    id: "SE-10843",
    date: "Jan 14, 2026",
    status: "Delivered",
    amount: "$124.90",
  },
  {
    id: "SE-10791",
    date: "Jan 02, 2026",
    status: "Shipped",
    amount: "$68.40",
  },
  {
    id: "SE-10658",
    date: "Dec 21, 2025",
    status: "Delivered",
    amount: "$212.00",
  },
];

export default function Profile() {
  return (
    <div className="h-[100dvh] bg-gray-950 text-white">
      <Navbar />

      <main className="mt-16 h-[calc(100dvh-4rem)] overflow-y-auto custom-scrollbar px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-600/90 flex items-center justify-center">
                  <UserRound className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {profile.name}
                  </h1>
                  <p className="text-gray-400">
                    Member since {profile.memberSince}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-600/20 border border-blue-500/40 px-4 py-2 text-blue-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">{profile.tier}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-800/70 border border-gray-700 px-4 py-3 flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-200">{profile.email}</span>
              </div>
              <div className="rounded-lg bg-gray-800/70 border border-gray-700 px-4 py-3 flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-200">{profile.phone}</span>
              </div>
              <div className="rounded-lg bg-gray-800/70 border border-gray-700 px-4 py-3 flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-200">Account Verified</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">{item.label}</p>
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{item.value}</p>
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-xl font-semibold">Saved Addresses</h2>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.type}
                    className="rounded-xl border border-gray-700 bg-gray-800/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{address.type}</p>
                      {address.primary && (
                        <span className="text-xs rounded-full bg-green-500/20 text-green-300 px-2 py-1 border border-green-500/30">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gray-300 flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                      <span>
                        {address.line1}
                        <br />
                        {address.line2}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-xl font-semibold">Payment Methods</h2>
              <div className="mt-4 space-y-3">
                {payments.map((card) => (
                  <div
                    key={card.last4}
                    className="rounded-xl border border-gray-700 bg-gray-800/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {card.brand} •••• {card.last4}
                      </p>
                      {card.primary && (
                        <span className="text-xs rounded-full bg-blue-500/20 text-blue-300 px-2 py-1 border border-blue-500/30">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      Expires {card.expiry}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="text-sm text-gray-400 border-b border-gray-800">
                    <th className="py-3 font-medium">Order ID</th>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800/70">
                      <td className="py-3 font-medium text-gray-200">
                        {order.id}
                      </td>
                      <td className="py-3 text-gray-300">{order.date}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            order.status === "Delivered"
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-100">{order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
