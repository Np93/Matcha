import React from "react";

const UnlikeConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg max-w-sm w-full relative">
        <h3 className="text-lg font-bold text-red-400 mb-3">Confirm Unlike</h3>
        <p className="text-sm text-gray-300 mb-4">
          Are you sure you want to unlike this user? This action is <strong>permanent</strong>.
          You won’t be able to chat or like them again.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnlikeConfirmationModal;