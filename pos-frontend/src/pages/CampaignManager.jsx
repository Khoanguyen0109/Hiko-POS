import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import {
  MdAdd,
  MdCasino,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import CampaignList from "../components/campaign/CampaignList";
import CampaignForm from "../components/campaign/CampaignForm";
import {
  fetchCampaigns,
  createCampaign,
  editCampaign,
  deactivateCampaignAction,
  clearError,
} from "../redux/slices/campaignSlice";

const CampaignManager = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { items: campaigns, loading, error } = useSelector(
    (state) => state.campaigns
  );

  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearError());
    }
  }, [error, enqueueSnackbar, dispatch]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !search.trim() ||
        campaign.name.toLowerCase().includes(search.toLowerCase()) ||
        campaign.slug.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "active") return campaign.isActive;
      if (statusFilter === "inactive") return !campaign.isActive;
      return true;
    });
  }, [campaigns, search, statusFilter]);

  const statusCounts = campaigns.reduce(
    (acc, campaign) => {
      if (campaign.isActive) acc.active += 1;
      else acc.inactive += 1;
      return acc;
    },
    { active: 0, inactive: 0 }
  );

  const handleSubmit = async (campaignData) => {
    try {
      if (editingCampaign) {
        await dispatch(
          editCampaign({ campaignId: editingCampaign._id, ...campaignData })
        ).unwrap();
        enqueueSnackbar("Campaign updated successfully!", { variant: "success" });
      } else {
        await dispatch(createCampaign(campaignData)).unwrap();
        enqueueSnackbar("Campaign created successfully!", { variant: "success" });
      }
      setShowForm(false);
      setEditingCampaign(null);
    } catch {
      // Error handled via Redux + snackbar effect
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      enqueueSnackbar("Spin link copied!", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to copy link", { variant: "error" });
    }
  };

  const handleDeactivate = async (campaignId) => {
    if (!window.confirm("Deactivate this campaign? Customers will no longer be able to play.")) {
      return;
    }

    try {
      await dispatch(deactivateCampaignAction(campaignId)).unwrap();
      enqueueSnackbar("Campaign deactivated!", { variant: "success" });
    } catch {
      // Error handled via Redux + snackbar effect
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] pb-20 overflow-x-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <MdCasino size={28} className="text-brand shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#f5f5f5]">
                  Campaign Manager
                </h1>
                <p className="text-[#ababab] text-sm">
                  Create and manage spin-game campaigns for hikomatcha.vn
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-brand hover:bg-brand-hover text-[#f5f5f5] rounded-lg font-semibold transition-colors text-sm whitespace-nowrap w-full lg:w-auto"
            >
              <MdAdd size={20} className="mr-2" />
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand text-sm font-medium">Total Campaigns</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">
                    {campaigns.length}
                  </p>
                </div>
                <MdCasino size={32} className="text-brand" />
              </div>
            </div>

            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Active</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">
                    {statusCounts.active}
                  </p>
                </div>
                <MdCheckCircle size={32} className="text-green-400" />
              </div>
            </div>

            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">
                    {statusCounts.inactive}
                  </p>
                </div>
                <MdCancel size={32} className="text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434]">
          <div className="p-6 border-b border-[#343434]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-brand"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <CampaignList
            campaigns={filteredCampaigns}
            loading={loading}
            onEdit={handleEdit}
            onCopyLink={handleCopyLink}
            onDeactivate={handleDeactivate}
          />
        </div>

        {showForm && (
          <CampaignForm
            campaign={editingCampaign}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowForm(false);
              setEditingCampaign(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CampaignManager;
