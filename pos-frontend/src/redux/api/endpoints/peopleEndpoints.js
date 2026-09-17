import { baseApi } from "../baseApi";
import { providesList, invalidatesList } from "../tagHelpers";

const PEOPLE_CACHE = {
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 60,
};

const SCHEDULE_CACHE = {
  keepUnusedDataFor: 60,
  refetchOnMountOrArgChange: 30,
};

const SALARY_CACHE = {
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
};

const withOptionalStoreHeader = (storeId) =>
  storeId
    ? { skipStoreHeader: true, headers: { "X-Store-Id": storeId } }
    : {};

const filterEmptyParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined
    )
  );

export const peopleApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // --- Stores ---
    getMyStores: build.query({
      query: () => ({ url: "/api/store/my-stores" }),
      providesTags: (result) => providesList("Store", result),
      ...PEOPLE_CACHE,
    }),
    getAllStores: build.query({
      query: () => ({ url: "/api/store" }),
      providesTags: (result) => providesList("Store", result),
      ...PEOPLE_CACHE,
    }),
    createStore: build.mutation({
      query: (data) => ({
        url: "/api/store",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Store", id: "LIST" }],
    }),
    getStoreById: build.query({
      query: (id) => ({ url: `/api/store/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Store", id }],
      ...PEOPLE_CACHE,
    }),
    updateStore: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/store/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => invalidatesList("Store", id),
    }),
    deleteStore: build.mutation({
      query: (id) => ({
        url: `/api/store/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Store", id),
    }),
    getStoreMembers: build.query({
      query: (storeId) => ({ url: `/api/store/${storeId}/members` }),
      providesTags: (result, _error, storeId) => [
        ...providesList("Member", result),
        { type: "Store", id: storeId },
      ],
      ...PEOPLE_CACHE,
    }),
    addStoreMember: build.mutation({
      query: ({ storeId, ...data }) => ({
        url: `/api/store/${storeId}/members`,
        method: "POST",
        data,
      }),
      invalidatesTags: (_result, _error, { storeId, userId }) => [
        ...invalidatesList("Store", storeId),
        ...invalidatesList("Member", userId),
      ],
    }),
    updateStoreMemberRole: build.mutation({
      query: ({ storeId, userId, ...data }) => ({
        url: `/api/store/${storeId}/members/${userId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { storeId, userId }) => [
        ...invalidatesList("Store", storeId),
        ...invalidatesList("Member", userId),
      ],
    }),
    removeStoreMember: build.mutation({
      query: ({ storeId, userId }) => ({
        url: `/api/store/${storeId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { storeId, userId }) => [
        ...invalidatesList("Store", storeId),
        ...invalidatesList("Member", userId),
      ],
    }),

    // --- Members ---
    getAllMembers: build.query({
      query: (params = {}) => ({
        url: "/api/member/",
        params,
      }),
      providesTags: (result) => providesList("Member", result),
      ...PEOPLE_CACHE,
    }),
    getMemberById: build.query({
      query: (id) => ({ url: `/api/member/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Member", id }],
      ...PEOPLE_CACHE,
    }),
    createMember: build.mutation({
      query: (data) => ({
        url: "/api/member/",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Member", id: "LIST" }],
    }),
    updateMember: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/member/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) =>
        invalidatesList("Member", id),
    }),
    deleteMember: build.mutation({
      query: (id) => ({
        url: `/api/member/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Member", id),
    }),
    toggleMemberActiveStatus: build.mutation({
      query: (id) => ({
        url: `/api/member/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Member", id),
    }),
    getMemberStores: build.query({
      query: (id) => ({ url: `/api/member/${id}/stores` }),
      providesTags: (_result, _error, id) => [
        { type: "Member", id },
        { type: "Store", id: "LIST" },
      ],
      ...PEOPLE_CACHE,
    }),
    updateMemberStores: build.mutation({
      query: ({ id, assignments }) => ({
        url: `/api/member/${id}/stores`,
        method: "PUT",
        data: { assignments },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...invalidatesList("Member", id),
        { type: "Store", id: "LIST" },
      ],
    }),
    getOwnProfile: build.query({
      query: () => ({ url: "/api/member/profile" }),
      providesTags: (result) =>
        result?._id
          ? [
              { type: "Member", id: result._id },
              { type: "Member", id: "PROFILE" },
            ]
          : [{ type: "Member", id: "PROFILE" }],
      ...PEOPLE_CACHE,
    }),
    updateOwnProfile: build.mutation({
      query: (data) => ({
        url: "/api/member/profile",
        method: "PUT",
        data,
      }),
      invalidatesTags: [{ type: "Member", id: "PROFILE" }, { type: "Member", id: "LIST" }],
    }),
    changePassword: build.mutation({
      query: (data) => ({
        url: "/api/member/change-password",
        method: "PUT",
        data,
      }),
    }),

    // --- Shift templates ---
    getAllShiftTemplates: build.query({
      query: (params) => ({
        url: "/api/shift-template",
        params,
      }),
      providesTags: (result) => providesList("ShiftTemplate", result),
      ...SCHEDULE_CACHE,
    }),
    getActiveShiftTemplates: build.query({
      query: () => ({ url: "/api/shift-template/active" }),
      providesTags: (result) => providesList("ShiftTemplate", result),
      ...SCHEDULE_CACHE,
    }),
    getAllShiftTemplatesAllStores: build.query({
      query: (params) => ({
        url: "/api/shift-template",
        params,
        skipStoreHeader: true,
      }),
      providesTags: (result) => providesList("ShiftTemplate", result),
      ...SCHEDULE_CACHE,
    }),
    getActiveShiftTemplatesAllStores: build.query({
      query: () => ({
        url: "/api/shift-template/active",
        skipStoreHeader: true,
      }),
      providesTags: (result) => providesList("ShiftTemplate", result),
      ...SCHEDULE_CACHE,
    }),
    getShiftTemplateById: build.query({
      query: (id) => ({ url: `/api/shift-template/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "ShiftTemplate", id }],
      ...SCHEDULE_CACHE,
    }),
    createShiftTemplate: build.mutation({
      query: (data) => ({
        url: "/api/shift-template",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "ShiftTemplate", id: "LIST" }],
    }),
    updateShiftTemplate: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/shift-template/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) =>
        invalidatesList("ShiftTemplate", id),
    }),
    deleteShiftTemplate: build.mutation({
      query: (id) => ({
        url: `/api/shift-template/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidatesList("ShiftTemplate", id),
    }),
    toggleShiftTemplateActiveStatus: build.mutation({
      query: (id) => ({
        url: `/api/shift-template/${id}/toggle-active`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) =>
        invalidatesList("ShiftTemplate", id),
    }),

    // --- Schedules ---
    getAllSchedules: build.query({
      query: (params) => ({
        url: "/api/schedule",
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getSchedulesByWeek: build.query({
      query: ({ year, week }) => ({
        url: `/api/schedule/week/${year}/${week}`,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getSchedulesByDate: build.query({
      query: (date) => ({ url: `/api/schedule/date/${date}` }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getSchedulesByDateRange: build.query({
      query: (params) => ({
        url: "/api/schedule/range",
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getSchedulesByMember: build.query({
      query: ({ memberId, ...params }) => ({
        url: `/api/schedule/member/${memberId}`,
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getScheduleById: build.query({
      query: (id) => ({ url: `/api/schedule/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Schedule", id }],
      ...SCHEDULE_CACHE,
    }),
    createSchedule: build.mutation({
      query: ({ storeId, ...data } = {}) => ({
        url: "/api/schedule",
        method: "POST",
        data,
        ...withOptionalStoreHeader(storeId),
      }),
      invalidatesTags: [{ type: "Schedule", id: "LIST" }],
    }),
    bulkCreateSchedules: build.mutation({
      query: (schedules) => ({
        url: "/api/schedule/bulk",
        method: "POST",
        data: { schedules },
      }),
      invalidatesTags: [{ type: "Schedule", id: "LIST" }],
    }),
    updateSchedule: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/schedule/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) =>
        invalidatesList("Schedule", id),
    }),
    deleteSchedule: build.mutation({
      query: (id) => ({
        url: `/api/schedule/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Schedule", id),
    }),
    assignMemberToShift: build.mutation({
      query: ({ scheduleId, memberId }) => ({
        url: `/api/schedule/${scheduleId}/assign`,
        method: "PATCH",
        data: { memberId },
      }),
      invalidatesTags: (_result, _error, { scheduleId }) =>
        invalidatesList("Schedule", scheduleId),
    }),
    batchAssignMembers: build.mutation({
      query: ({ scheduleId, memberIds, storeId }) => ({
        url: `/api/schedule/${scheduleId}/batch-assign`,
        method: "PATCH",
        data: { memberIds },
        ...withOptionalStoreHeader(storeId),
      }),
      invalidatesTags: (_result, _error, { scheduleId }) =>
        invalidatesList("Schedule", scheduleId),
    }),
    unassignMemberFromShift: build.mutation({
      query: ({ scheduleId, memberId }) => ({
        url: `/api/schedule/${scheduleId}/unassign`,
        method: "PATCH",
        data: { memberId },
      }),
      invalidatesTags: (_result, _error, { scheduleId }) =>
        invalidatesList("Schedule", scheduleId),
    }),
    updateMemberStatus: build.mutation({
      query: ({ scheduleId, memberId, status }) => ({
        url: `/api/schedule/${scheduleId}/status`,
        method: "PATCH",
        data: { memberId, status },
      }),
      invalidatesTags: (_result, _error, { scheduleId }) =>
        invalidatesList("Schedule", scheduleId),
    }),
    getMySchedules: build.query({
      query: (params) => ({
        url: "/api/schedule/my-schedule",
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getMySchedulesAllStores: build.query({
      query: (params) => ({
        url: "/api/schedule/my-schedule-all",
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getAllMembersWeek: build.query({
      query: ({ year, week }) => ({
        url: `/api/schedule/all-members-week/${year}/${week}`,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    checkScheduleConflicts: build.mutation({
      query: (data) => ({
        url: "/api/schedule/check-conflicts",
        method: "POST",
        data,
      }),
    }),

    // --- Extra work (Schedule tag; no ExtraWork tag) ---
    getAllExtraWork: build.query({
      query: (params) => ({
        url: "/api/extra-work",
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    getExtraWorkById: build.query({
      query: (id) => ({ url: `/api/extra-work/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Schedule", id }],
      ...SCHEDULE_CACHE,
    }),
    getExtraWorkByMember: build.query({
      query: ({ memberId, ...params }) => ({
        url: `/api/extra-work/member/${memberId}`,
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),
    createExtraWork: build.mutation({
      query: (data) => ({
        url: "/api/extra-work",
        method: "POST",
        data,
      }),
      invalidatesTags: [{ type: "Schedule", id: "LIST" }],
    }),
    updateExtraWork: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/extra-work/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) =>
        invalidatesList("Schedule", id),
    }),
    deleteExtraWork: build.mutation({
      query: (id) => ({
        url: `/api/extra-work/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Schedule", id),
    }),
    approveExtraWork: build.mutation({
      query: (id) => ({
        url: `/api/extra-work/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Schedule", id),
    }),
    markAsPaid: build.mutation({
      query: (id) => ({
        url: `/api/extra-work/${id}/mark-paid`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => invalidatesList("Schedule", id),
    }),
    getMyExtraWork: build.query({
      query: (params) => ({
        url: "/api/extra-work/my-extra-work",
        params,
      }),
      providesTags: (result) => providesList("Schedule", result),
      ...SCHEDULE_CACHE,
    }),

    // --- Shift checkout ---
    getShiftCheckoutPreview: build.query({
      query: ({ scheduleId, memberId } = {}) => ({
        url: `/api/shift-checkout/preview/${scheduleId}`,
        params: memberId ? { memberId } : undefined,
      }),
      providesTags: (_result, _error, arg) => [
        { type: "ShiftCheckout", id: arg?.scheduleId },
        { type: "ShiftCheckout", id: "LIST" },
      ],
      ...SCHEDULE_CACHE,
    }),
    submitShiftCheckout: build.mutation({
      query: (data) => ({
        url: "/api/shift-checkout",
        method: "POST",
        data,
      }),
      invalidatesTags: [
        { type: "ShiftCheckout", id: "LIST" },
        { type: "Schedule", id: "LIST" },
      ],
    }),
    submitShiftCheckIn: build.mutation({
      query: (data) => ({
        url: "/api/shift-checkout/check-in",
        method: "POST",
        data,
      }),
      invalidatesTags: [
        { type: "ShiftCheckout", id: "LIST" },
        { type: "Schedule", id: "LIST" },
      ],
    }),
    getMyShiftCheckoutsToday: build.query({
      query: (params) => ({
        url: "/api/shift-checkout/my-today",
        params,
      }),
      providesTags: (result) => providesList("ShiftCheckout", result),
      ...SCHEDULE_CACHE,
    }),
    getDayShiftCheckouts: build.query({
      query: (date) => ({ url: `/api/shift-checkout/day/${date}` }),
      providesTags: (result) => providesList("ShiftCheckout", result),
      ...SCHEDULE_CACHE,
    }),
    getShiftCheckoutList: build.query({
      query: (params) => ({
        url: "/api/shift-checkout/list",
        params,
      }),
      providesTags: (result) => providesList("ShiftCheckout", result),
      ...SCHEDULE_CACHE,
    }),
    getShiftCheckoutById: build.query({
      query: (id) => ({ url: `/api/shift-checkout/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "ShiftCheckout", id }],
      ...SCHEDULE_CACHE,
    }),
    deleteShiftCheckout: build.mutation({
      query: (id) => ({
        url: `/api/shift-checkout/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...invalidatesList("ShiftCheckout", id),
        { type: "Schedule", id: "LIST" },
      ],
    }),
    updateShiftCheckout: build.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/shift-checkout/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...invalidatesList("ShiftCheckout", id),
        { type: "Schedule", id: "LIST" },
      ],
    }),

    // --- Salary ---
    getMonthlySalary: build.query({
      query: ({ year, month }) => ({
        url: `/api/salary/${year}/${month}`,
      }),
      providesTags: (_result, _error, { year, month }) => [
        { type: "Salary", id: `${year}-${month}` },
        { type: "Salary", id: "LIST" },
      ],
      ...SALARY_CACHE,
    }),
    getAllMembersSalarySummary: build.query({
      query: (params = {}) => ({
        url: "/api/salary/summary/all",
        params: filterEmptyParams(params),
      }),
      providesTags: (result) => providesList("Salary", result),
      ...SALARY_CACHE,
    }),
  }),
});

export const {
  // Stores
  useGetMyStoresQuery,
  useGetAllStoresQuery,
  useCreateStoreMutation,
  useGetStoreByIdQuery,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
  useGetStoreMembersQuery,
  useAddStoreMemberMutation,
  useUpdateStoreMemberRoleMutation,
  useRemoveStoreMemberMutation,
  // Members
  useGetAllMembersQuery,
  useGetMemberByIdQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
  useToggleMemberActiveStatusMutation,
  useGetMemberStoresQuery,
  useUpdateMemberStoresMutation,
  useGetOwnProfileQuery,
  useUpdateOwnProfileMutation,
  useChangePasswordMutation,
  // Shift templates
  useGetAllShiftTemplatesQuery,
  useGetActiveShiftTemplatesQuery,
  useGetAllShiftTemplatesAllStoresQuery,
  useGetActiveShiftTemplatesAllStoresQuery,
  useGetShiftTemplateByIdQuery,
  useCreateShiftTemplateMutation,
  useUpdateShiftTemplateMutation,
  useDeleteShiftTemplateMutation,
  useToggleShiftTemplateActiveStatusMutation,
  // Schedules
  useGetAllSchedulesQuery,
  useGetSchedulesByWeekQuery,
  useGetSchedulesByDateQuery,
  useGetSchedulesByDateRangeQuery,
  useGetSchedulesByMemberQuery,
  useGetScheduleByIdQuery,
  useCreateScheduleMutation,
  useBulkCreateSchedulesMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  useAssignMemberToShiftMutation,
  useBatchAssignMembersMutation,
  useUnassignMemberFromShiftMutation,
  useUpdateMemberStatusMutation,
  useGetMySchedulesQuery,
  useGetMySchedulesAllStoresQuery,
  useGetAllMembersWeekQuery,
  useCheckScheduleConflictsMutation,
  // Extra work
  useGetAllExtraWorkQuery,
  useGetExtraWorkByIdQuery,
  useGetExtraWorkByMemberQuery,
  useCreateExtraWorkMutation,
  useUpdateExtraWorkMutation,
  useDeleteExtraWorkMutation,
  useApproveExtraWorkMutation,
  useMarkAsPaidMutation,
  useGetMyExtraWorkQuery,
  // Shift checkout
  useGetShiftCheckoutPreviewQuery,
  useSubmitShiftCheckoutMutation,
  useSubmitShiftCheckInMutation,
  useGetMyShiftCheckoutsTodayQuery,
  useGetDayShiftCheckoutsQuery,
  useGetShiftCheckoutListQuery,
  useGetShiftCheckoutByIdQuery,
  useDeleteShiftCheckoutMutation,
  useUpdateShiftCheckoutMutation,
  // Salary
  useGetMonthlySalaryQuery,
  useGetAllMembersSalarySummaryQuery,
} = peopleApi;
