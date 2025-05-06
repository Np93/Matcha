const NotificationItem = ({ notification, onClick, isNew }) => {
    const formatDate = (utcString) => {
        const date = new Date(utcString); // UTC automatiquement reconnu
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");     // Local time
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

    return (
      <div
        onClick={onClick}
        className={`cursor-pointer p-3 rounded-lg transition-all shadow-sm border 
          ${isNew ? "bg-red-500 text-white border-red-400" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}
        `}
      >
        <div className="font-semibold capitalize">{notification.type}</div>
        <div className="text-xs text-gray-400">{formatDate(notification.timestamp)}</div>
      </div>
    );
  };
  
  export default NotificationItem;