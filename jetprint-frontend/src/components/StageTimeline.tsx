import type { StageLog } from '../types';

const StageTimeline = ({ logs }: { logs: StageLog[] }) => {
  if (!logs || logs.length === 0) {
    return <p>No history available.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Order History</h3>
      <ol className="relative border-l border-gray-200">
        {logs.map((log) => (
          <li key={log.id} className="mb-6 ml-4">
            <div className="absolute w-3 h-3 bg-gray-300 rounded-full mt-1.5 -left-1.5 border border-white"></div>
            <time className="mb-1 text-sm font-normal leading-none text-gray-500">
              {new Date(log.timestamp).toLocaleString()}
            </time>
            <h4 className="text-md font-semibold text-gray-900">{log.stage.replace('_', ' ')}</h4>
            {log.duration && (
              <p className="text-sm font-normal text-gray-500">
                Duration: {log.duration} minutes
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default StageTimeline;