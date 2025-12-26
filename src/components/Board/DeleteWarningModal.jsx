import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

function DeleteWarningModal({
                                index,
                                updateCardTasks,
                                setShowDeleteWarning,
                                toDelete,
                                updateCards,
                            }) {
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setAnimateIn(true);
    }, []);

    const toDeleteText = toDelete === "card" ? "this card" : "all tasks";

    const onDeleteConfirm = () => {
        if (toDelete === "card") {
            updateCards((prev) => prev.filter((_, i) => i !== index));
        } else if (toDelete === "tasks") {
            updateCardTasks(index, {});
        }

        setShowDeleteWarning(false);
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
                className={`bg-white w-[24rem] rounded-xl shadow-2xl p-6 transform transition-all duration-300
        ${animateIn ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
                {/* icon */}
                <div className="flex justify-center mb-3">
                    <span className="text-3xl">⚠️</span>
                </div>

                {/* title */}
                <h2 className="text-lg font-semibold text-center text-gray-800">
                    Delete {toDeleteText}
                </h2>

                {/* description */}
                <p className="text-sm text-gray-500 text-center mt-2">
                    Are you sure you want to delete {toDeleteText}?
                    This action cannot be undone.
                </p>

                {/* actions */}
                <div className="flex justify-center gap-3 mt-6">
                    <button
                        onClick={() => setShowDeleteWarning(false)}
                        className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-medium
                       hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onDeleteConfirm}
                        className="px-5 py-2 rounded-lg bg-red-500 text-white text-sm font-medium
                       hover:bg-red-600 active:scale-95 transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default DeleteWarningModal;