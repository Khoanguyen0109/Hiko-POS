import PropTypes from "prop-types";
import { MdStore } from "react-icons/md";

const StoreSummariesTable = ({ title, summaries, columns }) => {
  if (!summaries?.length) return null;

  return (
    <div className="bg-[#262626] rounded-lg p-4 sm:p-5 lg:p-6 border border-[#343434]">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <MdStore className="text-brand" size={24} />
        <h2 className="text-xl font-semibold text-[#f5f5f5]">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#343434]">
              <th className="text-left py-3 px-2 sm:px-4 text-[#ababab] text-xs sm:text-sm font-medium">Store</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-right py-3 px-2 sm:px-4 text-[#ababab] text-xs sm:text-sm font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((row) => (
              <tr key={row.store?.id || row.store?._id} className="border-b border-[#343434] hover:bg-[#1f1f1f]">
                <td className="py-3 px-2 sm:px-4">
                  <div>
                    <p className="text-[#f5f5f5] font-medium text-sm">{row.store?.name}</p>
                    <p className="text-[#ababab] text-xs">{row.store?.code}</p>
                  </div>
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-2 sm:px-4 text-right text-sm text-[#f5f5f5]">
                    {col.format ? col.format(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

StoreSummariesTable.propTypes = {
  title: PropTypes.string.isRequired,
  summaries: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      format: PropTypes.func,
    })
  ).isRequired,
};

export default StoreSummariesTable;
