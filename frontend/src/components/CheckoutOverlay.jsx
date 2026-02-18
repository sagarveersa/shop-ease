import { motion } from "framer-motion";

export default function CheckoutOverlay({ status }) {
  if (status === "idle" || status === "error") return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      {status === "loading" && (
        <div className="bg-white p-10 rounded-xl shadow-lg">
          <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full" />
          <p className="mt-4 text-center font-medium">Placing your order...</p>
        </div>
      )}

      {status === "success" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-white p-12 rounded-xl shadow-xl flex flex-col items-center"
        >
          {/* Green Tick */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
          >
            ✓
          </motion.div>

          <p className="mt-6 text-lg font-semibold text-green-600">
            Order Placed Successfully!
          </p>
        </motion.div>
      )}
    </div>
  );
}
