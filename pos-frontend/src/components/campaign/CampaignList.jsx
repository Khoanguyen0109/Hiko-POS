import PropTypes from "prop-types";
import {
  MdEdit,
  MdLink,
  MdQrCode,
  MdBlock,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
} from "react-icons/md";
import { getSpinUrl } from "../../utils/spinQr";

const CampaignList = ({
  campaigns,
  loading,
  onEdit,
  onCopyLink,
  onDownloadQr,
  onDeactivate,
  downloadingSlug,
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (campaign) => {
    const now = new Date();
    const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

    if (!campaign.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
          <MdCancel size={12} className="mr-1" />
          Inactive
        </span>
      );
    }

    if (startDate && now < startDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/40 text-yellow-300">
          <MdSchedule size={12} className="mr-1" />
          Scheduled
        </span>
      );
    }

    if (endDate && now > endDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-300">
          <MdCancel size={12} className="mr-1" />
          Ended
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300">
        <MdCheckCircle size={12} className="mr-1" />
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#ababab]">Loading campaigns...</div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-[#ababab]">No campaigns yet.</p>
        <p className="text-sm text-[#666] mt-1">
          Create your first spin campaign to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#343434]">
        <thead className="bg-[#262626]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
              Campaign
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
              Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
              Slots
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1a1a] divide-y divide-[#343434]">
          {campaigns.map((campaign) => (
            <tr key={campaign._id} className="hover:bg-[#262626]">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-[#f5f5f5]">
                  {campaign.name}
                </div>
                {campaign.description && (
                  <div className="text-xs text-[#ababab] mt-1 max-w-xs truncate">
                    {campaign.description}
                  </div>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <code className="text-sm text-brand">{campaign.slug}</code>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[#f5f5f5]">
                  {formatDate(campaign.startDate)}
                </div>
                <div className="text-sm text-[#ababab]">
                  to {formatDate(campaign.endDate)}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f5f5f5]">
                {campaign.wheelSlots?.length ?? 0} slots
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(campaign)}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(campaign)}
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                    title="Edit"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopyLink(getSpinUrl(campaign.slug))}
                    className="p-1.5 text-brand hover:bg-brand/10 rounded transition-colors"
                    title="Copy spin link"
                  >
                    <MdLink size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadQr(campaign.slug)}
                    disabled={downloadingSlug === campaign.slug}
                    className="p-1.5 text-brand hover:bg-brand/10 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                    title="Download spin QR"
                  >
                    <MdQrCode size={18} />
                  </button>
                  {campaign.isActive && (
                    <button
                      type="button"
                      onClick={() => onDeactivate(campaign._id)}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Deactivate"
                    >
                      <MdBlock size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

CampaignList.propTypes = {
  campaigns: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      description: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      isActive: PropTypes.bool,
      wheelSlots: PropTypes.array,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCopyLink: PropTypes.func.isRequired,
  onDownloadQr: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  downloadingSlug: PropTypes.string,
};

export default CampaignList;
