import { axiosWrapper } from "../../https/axiosWrapper";

const unwrapResponse = (body) => {
  if (body && typeof body === "object" && "data" in body) {
    if (body.pagination) {
      return { data: body.data, pagination: body.pagination };
    }
    return body.data;
  }
  return body;
};

/**
 * RTK Query baseQuery that reuses the existing Axios instance
 * (auth token, X-Store-Id, 401 redirect).
 */
export const axiosBaseQuery =
  () =>
  async ({ url, method = "GET", data, params, headers, skipStoreHeader }) => {
    try {
      const result = await axiosWrapper({
        url,
        method,
        data,
        params,
        headers,
        skipStoreHeader,
      });
      return { data: unwrapResponse(result.data) };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status,
          data:
            axiosError.response?.data?.message ||
            axiosError.response?.data ||
            axiosError.message,
        },
      };
    }
  };
