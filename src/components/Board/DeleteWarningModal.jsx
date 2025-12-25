import React from "react";


function DeleteWarningModal({index, updateCardTasks, setShowDeleteWarning}) {

    const onDeleteConfirm = (index) => {
        updateCardTasks(index, {});
    };

    const handleDeleteCancel = () => {
        setShowDeleteWarning(false);
    }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg z-60">
              <h2 className="text-lg font-semibold mb-4">Delete All Tasks</h2>
              <p className="mb-4">
                  Are you sure you want to delete all tasks? This action cannot be
                  undone.{" "}
              </p>
              <div className="flex justify-end">
                  <button
                      onClick={handleDeleteCancel}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={() => {
                          onDeleteConfirm(index);
                          setShowDeleteWarning(false);
                      }}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                      Yes
                  </button>
              </div>
          </div>
      </div>
  )
}

export default DeleteWarningModal;
